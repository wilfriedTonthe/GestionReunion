const express = require('express');
const Loan = require('../models/Loan');
const Fine = require('../models/Fine');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

const TAUX_INTERET = 5; // 5% forfaitaire
const PENALITE_RETARD = 10; // 10$ tous les 7 jours de retard

// Calculer le fonds de caisse (amendes payées + intérêts des prêts)
const calculerFondsCaisse = async () => {
  const amendesPayees = await Fine.aggregate([
    { $match: { payee: true } },
    { $group: { _id: null, total: { $sum: '$montant' } } }
  ]);
  
  const interetsRecus = await Loan.aggregate([
    { $match: { statut: 'rembourse' } },
    { $group: { _id: null, total: { $sum: '$interet' } } }
  ]);
  
  const pretsEnCours = await Loan.aggregate([
    { $match: { statut: 'en_cours' } },
    { $group: { _id: null, total: { $sum: '$montant' } } }
  ]);
  
  const totalAmendes = amendesPayees[0]?.total || 0;
  const totalInterets = interetsRecus[0]?.total || 0;
  const totalPretsEnCours = pretsEnCours[0]?.total || 0;
  
  return {
    amendes: totalAmendes,
    interets: totalInterets,
    total: totalAmendes + totalInterets,
    disponible: totalAmendes + totalInterets - totalPretsEnCours,
    pretsEnCours: totalPretsEnCours
  };
};

// Récupérer tous les prêts (président, trésorier, censeur)
router.get('/', protect, authorize('president', 'tresorier', 'censeur'), async (req, res) => {
  try {
    const loans = await Loan.find()
      .populate('demandeur', 'nom prenom email photo')
      .populate('traitePar', 'nom prenom')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: loans.length, data: loans });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Récupérer mes prêts
router.get('/my', protect, async (req, res) => {
  try {
    const loans = await Loan.find({ demandeur: req.user._id })
      .populate('traitePar', 'nom prenom')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: loans.length, data: loans });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Fonds de caisse (accessible à tous les membres)
router.get('/fonds-caisse', protect, async (req, res) => {
  try {
    const fonds = await calculerFondsCaisse();
    res.json({ success: true, data: fonds });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Statistiques des prêts (président, trésorier, censeur)
router.get('/stats', protect, authorize('president', 'tresorier', 'censeur'), async (req, res) => {
  try {
    const loans = await Loan.find();
    const fonds = await calculerFondsCaisse();
    
    const stats = {
      total: loans.length,
      enAttente: loans.filter(l => l.statut === 'en_attente').length,
      approuves: loans.filter(l => l.statut === 'approuve' || l.statut === 'en_cours').length,
      refuses: loans.filter(l => l.statut === 'refuse').length,
      rembourses: loans.filter(l => l.statut === 'rembourse').length,
      montantTotal: loans.filter(l => ['approuve', 'en_cours', 'rembourse'].includes(l.statut))
        .reduce((sum, l) => sum + l.montant, 0),
      montantEnCours: loans.filter(l => l.statut === 'en_cours')
        .reduce((sum, l) => sum + (l.montantTotal - l.montantRembourse), 0),
      fondsCaisse: fonds,
      plafondPret: Math.floor(fonds.disponible * 0.5)
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Faire une demande de prêt (tous les membres)
router.post('/', protect, async (req, res) => {
  try {
    const { montant, motif } = req.body;

    // Vérifier si le membre a déjà un prêt en cours
    const pretEnCours = await Loan.findOne({
      demandeur: req.user._id,
      statut: { $in: ['en_attente', 'approuve', 'en_cours'] }
    });

    if (pretEnCours) {
      return res.status(400).json({ 
        message: 'Vous avez déjà une demande de prêt en cours ou un prêt non remboursé' 
      });
    }

    // Vérifier le plafond (50% du fonds disponible)
    const fonds = await calculerFondsCaisse();
    const plafond = Math.floor(fonds.disponible * 0.5);
    
    if (montant > plafond) {
      return res.status(400).json({ 
        message: `Le montant demandé dépasse le plafond autorisé de ${plafond}$ (50% du fonds disponible)` 
      });
    }

    // Calculer les intérêts (5% forfaitaire)
    const interet = Math.ceil(montant * TAUX_INTERET / 100);
    const montantTotal = montant + interet;

    // Date de remboursement = prochaine réunion (environ 1 mois)
    const dateRemboursementPrevue = new Date();
    dateRemboursementPrevue.setMonth(dateRemboursementPrevue.getMonth() + 1);

    const loan = await Loan.create({
      demandeur: req.user._id,
      montant,
      interet,
      tauxInteret: TAUX_INTERET,
      montantTotal,
      motif,
      dateRemboursementPrevue
    });

    const populatedLoan = await Loan.findById(loan._id)
      .populate('demandeur', 'nom prenom email');

    // Envoyer email au trésorier
    const tresorier = await User.findOne({ role: 'tresorier', actif: true });
    if (tresorier) {
      const htmlTresorier = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #6366f1; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">💰 Nouvelle Demande de Prêt</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151;">
              <strong>${req.user.prenom} ${req.user.nom}</strong> a soumis une demande de prêt.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Montant demandé:</strong> ${montant}$</p>
              <p><strong>Intérêts (${TAUX_INTERET}%):</strong> ${interet}$</p>
              <p><strong>Total à rembourser:</strong> ${montantTotal}$</p>
              <p><strong>Motif:</strong> ${motif}</p>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              Connectez-vous à l'application pour traiter cette demande.
            </p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              — L'équipe Unit Solidarité
            </p>
          </div>
        </div>
      `;
      await sendEmail(tresorier.email, `💰 Nouvelle demande de prêt - ${req.user.prenom} ${req.user.nom}`, htmlTresorier);
    }

    // Envoyer email de confirmation au demandeur
    const htmlDemandeur = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #10b981; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Demande de Prêt Reçue</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">
            Bonjour <strong>${req.user.prenom}</strong>,
          </p>
          <p style="font-size: 16px; color: #374151;">
            Votre demande de prêt a bien été enregistrée. Voici le récapitulatif :
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #374151;">📋 Détails du prêt</h3>
            <p><strong>Montant emprunté:</strong> ${montant}$</p>
            <p><strong>Taux d'intérêt:</strong> ${TAUX_INTERET}% forfaitaire</p>
            <p><strong>Intérêts:</strong> ${interet}$</p>
            <p style="font-size: 18px; color: #10b981;"><strong>💵 Total à rembourser: ${montantTotal}$</strong></p>
            <p><strong>📅 Échéance:</strong> À la prochaine réunion (1 mois)</p>
          </div>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h4 style="margin-top: 0; color: #92400e;">⚠️ Attention - Pénalités de retard</h4>
            <p style="color: #92400e; margin-bottom: 0;">
              En cas de non-remboursement à l'échéance, une pénalité de <strong>${PENALITE_RETARD}$</strong> sera appliquée tous les <strong>7 jours</strong> de retard.
            </p>
          </div>
          <p style="font-size: 14px; color: #6b7280;">
            Le trésorier examinera votre demande et vous serez notifié de sa décision.
          </p>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            — L'équipe Unit Solidarité
          </p>
        </div>
      </div>
    `;
    await sendEmail(req.user.email, '✅ Confirmation de votre demande de prêt - Unit Solidarité', htmlDemandeur);

    res.status(201).json({ 
      success: true, 
      data: populatedLoan,
      message: 'Demande de prêt soumise avec succès. Vous recevrez un email de confirmation.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la demande', error: error.message });
  }
});

// Approuver/Refuser un prêt (trésorier uniquement)
router.put('/:id/traiter', protect, authorize('tresorier'), async (req, res) => {
  try {
    const { statut, commentaire } = req.body;

    if (!['approuve', 'refuse'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: 'Prêt non trouvé' });
    }

    if (loan.statut !== 'en_attente') {
      return res.status(400).json({ message: 'Ce prêt a déjà été traité' });
    }

    loan.statut = statut === 'approuve' ? 'en_cours' : 'refuse';
    loan.traitePar = req.user._id;
    loan.dateTraitement = new Date();
    loan.commentaireTraitement = commentaire;

    await loan.save();

    const populatedLoan = await Loan.findById(loan._id)
      .populate('demandeur', 'nom prenom email')
      .populate('traitePar', 'nom prenom');

    res.json({ 
      success: true, 
      data: populatedLoan,
      message: statut === 'approuve' ? 'Prêt approuvé' : 'Prêt refusé'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Enregistrer un remboursement (trésorier uniquement)
router.post('/:id/remboursement', protect, authorize('tresorier'), async (req, res) => {
  try {
    const { montant, commentaire } = req.body;

    const loan = await Loan.findById(req.params.id).populate('demandeur', 'nom prenom email');

    if (!loan) {
      return res.status(404).json({ message: 'Prêt non trouvé' });
    }

    if (loan.statut !== 'en_cours') {
      return res.status(400).json({ message: 'Ce prêt n\'est pas en cours' });
    }

    const resteAPayer = loan.montantTotal - loan.montantRembourse;
    if (montant > resteAPayer) {
      return res.status(400).json({ 
        message: `Le montant ne peut pas dépasser ${resteAPayer}$` 
      });
    }

    loan.remboursements.push({
      montant,
      commentaire,
      type: 'capital'
    });
    loan.montantRembourse += montant;

    if (loan.montantRembourse >= loan.montantTotal) {
      loan.statut = 'rembourse';
    }

    await loan.save();

    const populatedLoan = await Loan.findById(loan._id)
      .populate('demandeur', 'nom prenom email')
      .populate('traitePar', 'nom prenom');

    res.json({ 
      success: true, 
      data: populatedLoan,
      message: loan.statut === 'rembourse' ? 'Prêt entièrement remboursé' : 'Remboursement enregistré'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;

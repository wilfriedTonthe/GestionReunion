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
  // Amendes payées (statut = 'payee')
  const amendesPayees = await Fine.aggregate([
    { $match: { statut: 'payee' } },
    { $group: { _id: null, total: { $sum: '$montant' } } }
  ]);
  
  // Intérêts des prêts remboursés
  const interetsRecus = await Loan.aggregate([
    { $match: { statut: 'rembourse' } },
    { $group: { _id: null, total: { $sum: '$interet' } } }
  ]);
  
  // Prêts en cours (argent sorti du fonds)
  const pretsEnCours = await Loan.aggregate([
    { $match: { statut: 'en_cours' } },
    { $group: { _id: null, total: { $sum: '$montant' } } }
  ]);
  
  const totalAmendes = amendesPayees[0]?.total || 0;
  const totalInterets = interetsRecus[0]?.total || 0;
  const totalPretsEnCours = pretsEnCours[0]?.total || 0;
  
  const total = totalAmendes + totalInterets;
  const disponible = total - totalPretsEnCours;
  const plafondPret = Math.floor(disponible * 0.5);
  
  return {
    amendes: totalAmendes,
    interets: totalInterets,
    total: total,
    disponible: disponible,
    pretsEnCours: totalPretsEnCours,
    plafondPret: plafondPret
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
    const { motif } = req.body;
    const montant = Number(req.body.montant);

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

    // Les emails seront envoyés de manière asynchrone par le scheduler
    console.log('Demande de prêt créée, notification en attente d\'envoi...');

    res.status(201).json({ 
      success: true, 
      data: populatedLoan,
      message: 'Demande de prêt soumise avec succès. Vous recevrez un email de confirmation.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la demande', error: error.message });
  }
});

// Annuler sa propre demande de prêt (si pas encore approuvée)
router.delete('/:id/annuler', protect, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: 'Prêt non trouvé' });
    }

    // Vérifier que c'est bien le demandeur
    if (loan.demandeur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez annuler que vos propres demandes' });
    }

    // Vérifier que le prêt n'a pas encore été approuvé
    if (loan.statut !== 'en_attente') {
      return res.status(400).json({ message: 'Impossible d\'annuler une demande déjà traitée' });
    }

    await Loan.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      message: 'Demande de prêt annulée avec succès'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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

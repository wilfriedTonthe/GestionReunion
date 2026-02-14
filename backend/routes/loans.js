const express = require('express');
const Loan = require('../models/Loan');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

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

// Statistiques des prêts (président, trésorier, censeur)
router.get('/stats', protect, authorize('president', 'tresorier', 'censeur'), async (req, res) => {
  try {
    const loans = await Loan.find();
    
    const stats = {
      total: loans.length,
      enAttente: loans.filter(l => l.statut === 'en_attente').length,
      approuves: loans.filter(l => l.statut === 'approuve' || l.statut === 'en_cours').length,
      refuses: loans.filter(l => l.statut === 'refuse').length,
      rembourses: loans.filter(l => l.statut === 'rembourse').length,
      montantTotal: loans.filter(l => ['approuve', 'en_cours', 'rembourse'].includes(l.statut))
        .reduce((sum, l) => sum + l.montant, 0),
      montantEnCours: loans.filter(l => l.statut === 'en_cours')
        .reduce((sum, l) => sum + (l.montant - l.montantRembourse), 0)
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Faire une demande de prêt (tous les membres)
router.post('/', protect, async (req, res) => {
  try {
    const { montant, motif, dateRemboursementPrevue } = req.body;

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

    const loan = await Loan.create({
      demandeur: req.user._id,
      montant,
      motif,
      dateRemboursementPrevue
    });

    const populatedLoan = await Loan.findById(loan._id)
      .populate('demandeur', 'nom prenom email');

    res.status(201).json({ 
      success: true, 
      data: populatedLoan,
      message: 'Demande de prêt soumise avec succès'
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

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: 'Prêt non trouvé' });
    }

    if (loan.statut !== 'en_cours') {
      return res.status(400).json({ message: 'Ce prêt n\'est pas en cours' });
    }

    const resteAPayer = loan.montant - loan.montantRembourse;
    if (montant > resteAPayer) {
      return res.status(400).json({ 
        message: `Le montant ne peut pas dépasser ${resteAPayer}$` 
      });
    }

    loan.remboursements.push({
      montant,
      commentaire
    });
    loan.montantRembourse += montant;

    if (loan.montantRembourse >= loan.montant) {
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

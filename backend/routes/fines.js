const express = require('express');
const Fine = require('../models/Fine');
const { TYPES_AMENDES } = require('../models/Fine');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/types', protect, (req, res) => {
  res.json({ success: true, data: TYPES_AMENDES });
});

router.get('/', protect, async (req, res) => {
  try {
    const { statut, membre } = req.query;
    const filter = {};
    
    if (statut) filter.statut = statut;
    if (membre) filter.membre = membre;

    const fines = await Fine.find(filter)
      .populate('membre', 'nom prenom email')
      .populate('reunion', 'titre date')
      .populate('creePar', 'nom prenom')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: fines.length, data: fines });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const fines = await Fine.find({ membre: req.user._id })
      .populate('reunion', 'titre date')
      .sort({ createdAt: -1 });

    const total = fines
      .filter(f => f.statut === 'en_attente')
      .reduce((sum, f) => sum + f.montant, 0);

    res.json({ 
      success: true, 
      count: fines.length, 
      totalEnAttente: total,
      data: fines 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/stats', protect, authorize('president', 'tresorier', 'censeur'), async (req, res) => {
  try {
    const stats = await Fine.aggregate([
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 },
          total: { $sum: '$montant' }
        }
      }
    ]);

    const byMotif = await Fine.aggregate([
      {
        $group: {
          _id: '$motif',
          count: { $sum: 1 },
          total: { $sum: '$montant' }
        }
      }
    ]);

    const totalPaye = await Fine.aggregate([
      { $match: { statut: 'payee' } },
      { $group: { _id: null, total: { $sum: '$montant' } } }
    ]);

    const totalNonPaye = await Fine.aggregate([
      { $match: { statut: 'en_attente' } },
      { $group: { _id: null, total: { $sum: '$montant' } } }
    ]);

    res.json({ 
      success: true, 
      data: { 
        parStatut: stats, 
        parMotif: byMotif,
        totalPaye: totalPaye[0]?.total || 0,
        totalNonPaye: totalNonPaye[0]?.total || 0
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.post('/', protect, authorize('censeur'), async (req, res) => {
  try {
    const fineData = {
      ...req.body,
      creePar: req.user._id,
      automatique: false
    };

    const fine = await Fine.create(fineData);
    await fine.populate('membre', 'nom prenom email');

    res.status(201).json({ success: true, data: fine });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création', error: error.message });
  }
});

router.put('/:id/pay', protect, authorize('censeur'), async (req, res) => {
  try {
    const fine = await Fine.findByIdAndUpdate(
      req.params.id,
      { 
        statut: 'payee',
        datePaiement: new Date()
      },
      { new: true }
    ).populate('membre', 'nom prenom');

    if (!fine) {
      return res.status(404).json({ message: 'Amende non trouvée' });
    }

    res.json({ success: true, data: fine, message: 'Paiement enregistré' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.put('/:id/cancel', protect, authorize('censeur'), async (req, res) => {
  try {
    const fine = await Fine.findByIdAndUpdate(
      req.params.id,
      { statut: 'annulee' },
      { new: true }
    );

    if (!fine) {
      return res.status(404).json({ message: 'Amende non trouvée' });
    }

    res.json({ success: true, data: fine, message: 'Amende annulée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;

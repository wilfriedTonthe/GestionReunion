const express = require('express');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Récupérer tous les communiqués
router.get('/', protect, async (req, res) => {
  try {
    const announcements = await Announcement.find({ actif: true })
      .populate('creePar', 'nom prenom role')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: announcements.length, data: announcements });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Créer un communiqué (président, censeur, trésorier)
router.post('/', protect, authorize('president', 'censeur', 'tresorier'), async (req, res) => {
  try {
    const { titre, contenu, type, envoyerEmail } = req.body;

    // Créer le communiqué - les emails seront envoyés par le scheduler
    const announcement = await Announcement.create({
      titre,
      contenu,
      type: type || 'info',
      creePar: req.user._id,
      envoyerEmail: envoyerEmail !== false,
      emailEnvoye: false
    });

    console.log(`Communiqué "${titre}" créé, notifications en attente d'envoi...`);

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('creePar', 'nom prenom role');

    res.status(201).json({ 
      success: true, 
      data: populatedAnnouncement,
      message: envoyerEmail ? 'Communiqué créé et envoyé par email' : 'Communiqué créé'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création', error: error.message });
  }
});

// Supprimer un communiqué
router.delete('/:id', protect, authorize('president', 'censeur', 'tresorier'), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { actif: false },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({ message: 'Communiqué non trouvé' });
    }

    res.json({ success: true, message: 'Communiqué supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;

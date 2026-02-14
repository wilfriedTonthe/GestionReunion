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

    const announcement = await Announcement.create({
      titre,
      contenu,
      type: type || 'info',
      creePar: req.user._id
    });

    // Envoyer par email si demandé
    if (envoyerEmail) {
      const allMembers = await User.find({ actif: true });
      
      const typeLabels = {
        info: 'ℹ️ Information',
        urgent: '🚨 Urgent',
        rappel: '🔔 Rappel',
        evenement: '🎉 Événement'
      };

      const typeColors = {
        info: '#3b82f6',
        urgent: '#ef4444',
        rappel: '#f59e0b',
        evenement: '#10b981'
      };

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${typeColors[type] || '#6366f1'}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">${typeLabels[type] || 'Communiqué'}</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-top: 0;">${titre}</h2>
            <div style="font-size: 16px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${contenu}</div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              Publié par ${req.user.prenom} ${req.user.nom}<br>
              — L'équipe Unit Solidarité
            </p>
          </div>
        </div>
      `;

      let emailsSent = 0;
      for (const member of allMembers) {
        const sent = await sendEmail(member.email, `${typeLabels[type] || 'Communiqué'} - ${titre}`, html);
        if (sent) emailsSent++;
      }

      console.log(`Communiqué "${titre}" - Emails envoyés: ${emailsSent}/${allMembers.length}`);
    }

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

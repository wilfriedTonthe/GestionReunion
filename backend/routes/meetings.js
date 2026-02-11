const express = require('express');
const Meeting = require('../models/Meeting');
const Fine = require('../models/Fine');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendMeetingReminder } = require('../utils/emailService');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate('creePar', 'nom prenom')
      .populate('presences.membre', 'nom prenom')
      .sort({ date: -1 });
    res.json({ success: true, count: meetings.length, data: meetings });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/upcoming', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const meetings = await Meeting.find({
      $or: [
        { date: { $gte: today } },
        { statut: 'en_cours' }
      ],
      statut: { $in: ['planifiee', 'en_cours'] }
    })
      .populate('creePar', 'nom prenom')
      .sort({ date: 1 });
    res.json({ success: true, count: meetings.length, data: meetings });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('creePar', 'nom prenom')
      .populate('presences.membre', 'nom prenom email');
    
    if (!meeting) {
      return res.status(404).json({ message: 'Réunion non trouvée' });
    }
    
    res.json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.post('/', protect, authorize('president'), async (req, res) => {
  try {
    const meetingData = {
      ...req.body,
      creePar: req.user._id
    };
    
    const meeting = await Meeting.create(meetingData);
    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création', error: error.message });
  }
});

router.put('/:id', protect, authorize('president'), async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!meeting) {
      return res.status(404).json({ message: 'Réunion non trouvée' });
    }
    
    res.json({ success: true, data: meeting });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.put('/:id/start', protect, authorize('president', 'censeur', 'tresorier'), async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { statut: 'en_cours' },
      { new: true }
    );
    
    if (!meeting) {
      return res.status(404).json({ message: 'Réunion non trouvée' });
    }
    
    res.json({ success: true, data: meeting, message: 'Réunion démarrée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.put('/:id/end', protect, authorize('president', 'censeur', 'tresorier'), async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Réunion non trouvée' });
    }

    const allMembers = await User.find({ actif: true });
    const presentMemberIds = meeting.presences.map(p => p.membre.toString());
    
    const absentMembers = allMembers.filter(
      member => !presentMemberIds.includes(member._id.toString())
    );

    const finePromises = absentMembers.map(member => 
      Fine.create({
        membre: member._id,
        reunion: meeting._id,
        typeAmende: 'absence_non_justifiee',
        montant: 50,
        motif: 'absence',
        description: `Absence à la réunion: ${meeting.titre}`,
        automatique: true,
        creePar: req.user._id
      })
    );

    await Promise.all(finePromises);

    meeting.statut = 'terminee';
    await meeting.save();

    res.json({ 
      success: true, 
      data: meeting, 
      message: `Réunion terminée. ${absentMembers.length} amende(s) générée(s) pour absence.`
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.delete('/:id', protect, authorize('president'), async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { statut: 'annulee' },
      { new: true }
    );
    
    if (!meeting) {
      return res.status(404).json({ message: 'Réunion non trouvée' });
    }
    
    res.json({ success: true, message: 'Réunion annulée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.post('/:id/send-reminder', protect, authorize('president'), async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Réunion non trouvée' });
    }

    const allMembers = await User.find({ actif: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const meetingDate = new Date(meeting.date);
    meetingDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((meetingDate - today) / (1000 * 60 * 60 * 24));

    await sendMeetingReminder(allMembers, meeting, daysUntil);
    
    res.json({ 
      success: true, 
      message: `Rappel envoyé à ${allMembers.length} membres pour la réunion "${meeting.titre}"` 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;

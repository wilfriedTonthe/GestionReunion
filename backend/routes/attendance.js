const express = require('express');
const Meeting = require('../models/Meeting');
const Fine = require('../models/Fine');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/:meetingId/checkin', protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    console.log('Check-in request:', { meetingId: req.params.meetingId, latitude, longitude, userId: req.user._id });
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Coordonnées GPS requises' });
    }

    const meeting = await Meeting.findById(req.params.meetingId);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Réunion non trouvée' });
    }

    console.log('Meeting status:', meeting.statut, 'Rayon:', meeting.rayonPointage);
    console.log('Meeting coordinates:', meeting.lieu?.coordinates);

    if (meeting.statut !== 'en_cours') {
      console.log('ERREUR: Réunion pas en cours');
      return res.status(400).json({ message: `Le pointage n'est possible que pendant une réunion en cours. Statut actuel: ${meeting.statut}` });
    }

    const dejaPointe = meeting.presences.some(
      p => p.membre.toString() === req.user._id.toString()
    );
    
    if (dejaPointe) {
      console.log('ERREUR: Déjà pointé');
      return res.status(400).json({ message: 'Vous avez déjà pointé pour cette réunion' });
    }

    const dansZone = meeting.estDansZone(latitude, longitude);
    console.log('Dans zone:', dansZone);
    
    if (!dansZone) {
      console.log('ERREUR: Hors zone');
      return res.status(400).json({ 
        message: `Vous devez être à moins de ${meeting.rayonPointage}m du lieu de réunion pour pointer` 
      });
    }

    const now = new Date();
    const [heures, minutes] = meeting.heureDebut.split(':').map(Number);
    const heureDebutReunion = new Date(meeting.date);
    heureDebutReunion.setHours(heures, minutes, 0, 0);

    const enRetard = now > heureDebutReunion;

    meeting.presences.push({
      membre: req.user._id,
      heurePointage: now,
      enRetard,
      coordonneesPointage: { latitude, longitude }
    });

    await meeting.save();

    if (enRetard) {
      await Fine.create({
        membre: req.user._id,
        reunion: meeting._id,
        typeAmende: 'retard_simple',
        montant: 10,
        motif: 'retard',
        description: `Retard à la réunion: ${meeting.titre}`,
        automatique: true
      });

      return res.json({
        success: true,
        message: 'Pointage enregistré avec retard. Une amende a été générée.',
        enRetard: true
      });
    }

    res.json({
      success: true,
      message: 'Pointage enregistré avec succès',
      enRetard: false
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/:meetingId/status', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.meetingId)
      .populate('presences.membre', 'nom prenom');
    
    if (!meeting) {
      return res.status(404).json({ message: 'Réunion non trouvée' });
    }

    const userPresence = meeting.presences.find(
      p => p.membre._id.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      data: {
        aPointe: !!userPresence,
        presence: userPresence,
        totalPresents: meeting.presences.length,
        presences: meeting.presences
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;

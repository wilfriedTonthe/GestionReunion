const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('president', 'tresorier', 'censeur'), async (req, res) => {
  try {
    const users = await User.find({ actif: true }).select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.put('/:id', protect, authorize('president'), async (req, res) => {
  try {
    const { nom, prenom, email, role, telephone, actif } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { nom, prenom, email, role, telephone, actif },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/me/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.put('/me/profile', protect, async (req, res) => {
  try {
    const { nom, prenom, email, telephone, bio, dateNaissance, photo } = req.body;
    
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { nom, prenom, email, telephone, bio, dateNaissance, photo },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.get('/birthdays/upcoming', protect, async (req, res) => {
  try {
    const users = await User.find({ 
      actif: true,
      'dateNaissance.jour': { $exists: true },
      'dateNaissance.mois': { $exists: true }
    }).select('nom prenom dateNaissance photo');

    // Utiliser le fuseau horaire UTC-5 (Montréal/New York)
    const now = new Date();
    const offsetMs = -5 * 60 * 60 * 1000; // UTC-5
    const localNow = new Date(now.getTime() + offsetMs + now.getTimezoneOffset() * 60 * 1000);
    
    // Début de la journée locale
    const today = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());

    const upcomingBirthdays = users.map(user => {
      const { jour, mois } = user.dateNaissance;
      let daysUntil;
      
      const thisYearBirthday = new Date(today.getFullYear(), mois - 1, jour);
      const nextYearBirthday = new Date(today.getFullYear() + 1, mois - 1, jour);
      
      if (thisYearBirthday >= today) {
        daysUntil = Math.round((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
      } else {
        daysUntil = Math.round((nextYearBirthday - today) / (1000 * 60 * 60 * 24));
      }

      return {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        photo: user.photo,
        jour,
        mois,
        daysUntil,
        isCurrentUser: user._id.toString() === req.user._id.toString()
      };
    }).filter(u => u.daysUntil <= 30).sort((a, b) => a.daysUntil - b.daysUntil);

    res.json({ success: true, data: upcomingBirthdays });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.delete('/:id', protect, authorize('president'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { actif: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ success: true, message: 'Utilisateur désactivé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.delete('/:id/permanent', protect, authorize('president'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ success: true, message: 'Utilisateur supprimé définitivement' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;

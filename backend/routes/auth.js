const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendEmail, checkAndNotifyNewMemberBirthday } = require('../utils/emailService');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_dev_key', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, dateNaissance } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const user = await User.create({
      nom,
      prenom,
      email,
      password,
      telephone,
      dateNaissance
    });

    // Vérifier si l'anniversaire du nouveau membre est proche (moins de 7 jours)
    if (dateNaissance?.jour && dateNaissance?.mois) {
      const allMembers = await User.find({ actif: true });
      await checkAndNotifyNewMemberBirthday(user, allMembers);
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'inscription', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la connexion', error: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      nom: req.user.nom,
      prenom: req.user.prenom,
      email: req.user.email,
      role: req.user.role,
      telephone: req.user.telephone
    }
  });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'Aucun compte avec cet email' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = resetExpires;
    await user.save({ validateBeforeSave: false });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Réinitialisation du mot de passe</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">Bonjour ${user.prenom},</p>
          <p style="font-size: 16px; color: #374151;">Voici votre code de réinitialisation :</p>
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1;">${resetCode}</span>
          </div>
          <p style="font-size: 14px; color: #6b7280;">Ce code expire dans 15 minutes.</p>
          <p style="font-size: 14px; color: #6b7280;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
      </div>
    `;

    await sendEmail(user.email, 'Code de réinitialisation - RegioConnect', html);

    res.json({ success: true, message: 'Code envoyé par email' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'envoi', error: error.message });
  }
});

router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    const user = await User.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Code invalide ou expiré' });
    }

    res.json({ success: true, message: 'Code validé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    const user = await User.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Code invalide ou expiré' });
    }

    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Mot de passe mis à jour' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;

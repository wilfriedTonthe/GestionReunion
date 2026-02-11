const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  prenom: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['president', 'tresorier', 'censeur', 'membre'],
    default: 'membre'
  },
  telephone: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    default: null
  },
  dateNaissance: {
    jour: { type: Number, min: 1, max: 31 },
    mois: { type: Number, min: 1, max: 12 }
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  actif: {
    type: Boolean,
    default: true
  },
  rappelsAnniversaireEnvoyes: {
    unMois: { type: Boolean, default: false },
    septJours: { type: Boolean, default: false },
    veille: { type: Boolean, default: false },
    annee: { type: Number }
  },
  resetPasswordCode: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  demandeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  montant: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [1, 'Le montant doit être positif']
  },
  interet: {
    type: Number,
    default: 0
  },
  tauxInteret: {
    type: Number,
    default: 5
  },
  montantTotal: {
    type: Number,
    default: 0
  },
  motif: {
    type: String,
    required: [true, 'Le motif est requis']
  },
  statut: {
    type: String,
    enum: ['en_attente', 'approuve', 'refuse', 'rembourse', 'en_cours'],
    default: 'en_attente'
  },
  dateRemboursementPrevue: {
    type: Date
  },
  montantRembourse: {
    type: Number,
    default: 0
  },
  penalites: {
    type: Number,
    default: 0
  },
  emailNotificationEnvoye: {
    type: Boolean,
    default: false
  },
  remboursements: [{
    montant: Number,
    date: { type: Date, default: Date.now },
    commentaire: String,
    type: { type: String, enum: ['capital', 'penalite'], default: 'capital' }
  }],
  traitePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dateTraitement: {
    type: Date
  },
  commentaireTraitement: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Loan', loanSchema);

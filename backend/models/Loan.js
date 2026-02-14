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
  remboursements: [{
    montant: Number,
    date: { type: Date, default: Date.now },
    commentaire: String
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

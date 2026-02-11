const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  sujet: {
    type: String,
    required: [true, 'Le sujet est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  options: [{
    texte: {
      type: String,
      required: true
    },
    votes: {
      type: Number,
      default: 0
    }
  }],
  votants: [{
    membre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    optionChoisie: {
      type: Number
    },
    dateVote: {
      type: Date,
      default: Date.now
    }
  }],
  reunion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  statut: {
    type: String,
    enum: ['en_attente', 'ouvert', 'ferme'],
    default: 'en_attente'
  },
  dateOuverture: {
    type: Date
  },
  dateFermeture: {
    type: Date
  },
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

voteSchema.methods.aDejaVote = function(membreId) {
  return this.votants.some(v => v.membre.toString() === membreId.toString());
};

module.exports = mongoose.model('Vote', voteSchema);

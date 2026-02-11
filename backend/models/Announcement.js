const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true
  },
  contenu: {
    type: String,
    required: [true, 'Le contenu est requis']
  },
  type: {
    type: String,
    enum: ['info', 'urgent', 'rappel', 'evenement'],
    default: 'info'
  },
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);

const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'La date est requise']
  },
  heureDebut: {
    type: String,
    required: [true, 'L\'heure de début est requise']
  },
  heureFin: {
    type: String
  },
  lieu: {
    nom: {
      type: String,
      required: [true, 'Le nom du lieu est requis']
    },
    adresse: String,
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'La latitude est requise']
      },
      longitude: {
        type: Number,
        required: [true, 'La longitude est requise']
      }
    }
  },
  rayonPointage: {
    type: Number,
    default: 1000
  },
  statut: {
    type: String,
    enum: ['planifiee', 'en_cours', 'terminee', 'annulee'],
    default: 'planifiee'
  },
  presences: [{
    membre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    heurePointage: Date,
    enRetard: {
      type: Boolean,
      default: false
    },
    coordonneesPointage: {
      latitude: Number,
      longitude: Number
    }
  }],
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rappelJ7Envoye: {
    type: Boolean,
    default: false
  },
  rappelJourJEnvoye: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

meetingSchema.methods.estDansZone = function(latitude, longitude) {
  const R = 6371e3;
  const φ1 = this.lieu.coordinates.latitude * Math.PI / 180;
  const φ2 = latitude * Math.PI / 180;
  const Δφ = (latitude - this.lieu.coordinates.latitude) * Math.PI / 180;
  const Δλ = (longitude - this.lieu.coordinates.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance <= this.rayonPointage;
};

module.exports = mongoose.model('Meeting', meetingSchema);

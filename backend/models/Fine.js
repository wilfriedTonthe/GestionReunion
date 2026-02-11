const mongoose = require('mongoose');

const TYPES_AMENDES = {
  retard_simple: { label: 'Retard simple (après 19h30)', montant: 10, categorie: 'retards' },
  grand_retard: { label: 'Grand retard (plus de 30 min)', montant: 20, categorie: 'retards' },
  absence_justifiee: { label: 'Absence justifiée 24h avant', montant: 10, categorie: 'retards' },
  absence_non_justifiee: { label: 'Absence ou arrivée après 20h59', montant: 50, categorie: 'retards' },
  retard_hote: { label: 'Retard de l\'hôte', montant: 20, categorie: 'retards' },
  echec_cotisation: { label: 'Échec de cotisation le jour J', montant: 50, categorie: 'financier' },
  defaillance_cotisation: { label: 'Défaillance de cotisation', montant: 100, categorie: 'financier' },
  retard_argent_nourriture: { label: 'Retard sur l\'envoi d\'argent nourriture', montant: 15, categorie: 'financier' },
  argent_non_especes: { label: 'Argent non remis en espèces', montant: 5, categorie: 'financier' },
  sabotage_culinaire: { label: 'Sabotage culinaire', montant: 50, categorie: 'organisation' },
  retard_remboursement_pret: { label: 'Retard remboursement prêt (par 7 jours)', montant: 10, categorie: 'prets' },
  violation_confidentialite: { label: 'Violation de confidentialité', montant: 90, categorie: 'discipline' },
  autre: { label: 'Autre infraction', montant: 0, categorie: 'autre' }
};

const fineSchema = new mongoose.Schema({
  membre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le membre est requis']
  },
  reunion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  typeAmende: {
    type: String,
    enum: Object.keys(TYPES_AMENDES),
    required: [true, 'Le type d\'amende est requis']
  },
  montant: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: 0
  },
  motif: {
    type: String,
    enum: ['retard', 'absence', 'financier', 'organisation', 'discipline', 'autre'],
    required: [true, 'Le motif est requis']
  },
  description: {
    type: String,
    trim: true
  },
  statut: {
    type: String,
    enum: ['en_attente', 'payee', 'annulee'],
    default: 'en_attente'
  },
  datePaiement: {
    type: Date
  },
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  automatique: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Fine', fineSchema);
module.exports.TYPES_AMENDES = TYPES_AMENDES;

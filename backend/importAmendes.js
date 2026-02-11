const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Fine = require('./models/Fine');

const amendes = [
  { prenom: 'Rodevine', date: '2026-01-31', type: 'retard_simple', montant: 10, paye: true, datePaiement: '2026-01-31' },
  { prenom: 'Dominique', date: '2026-01-31', type: 'retard_simple', montant: 10, paye: true, datePaiement: '2026-01-31' },
  { prenom: 'Achille', date: '2026-01-31', type: 'retard_simple', montant: 10, paye: false },
  { prenom: 'Rikiel', date: '2026-01-31', type: 'retard_simple', montant: 10, paye: false },
  { prenom: 'Carelle', date: '2026-01-31', type: 'retard_simple', montant: 10, paye: true },
  { prenom: 'Arthur', date: '2026-01-31', type: 'absence_non_justifiee', montant: 50, paye: true, datePaiement: '2026-01-31' },
  { prenom: 'Priscille', date: '2026-01-31', type: 'argent_non_especes', montant: 5, paye: true },
  { prenom: 'Carelle', date: '2026-01-31', type: 'argent_non_especes', montant: 5, paye: true },
  { prenom: 'Rikiel', date: '2026-01-31', type: 'argent_non_especes', montant: 5, paye: false },
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connexion MongoDB OK');
  
  let created = 0;
  let errors = 0;
  
  for (const amende of amendes) {
    const user = await User.findOne({ 
      prenom: { $regex: new RegExp(`^${amende.prenom}`, 'i') }
    });
    
    if (!user) {
      console.log(`❌ Utilisateur non trouvé: ${amende.prenom}`);
      errors++;
      continue;
    }
    
    const motifMap = {
      retard_simple: 'retard',
      absence_non_justifiee: 'absence',
      argent_non_especes: 'financier'
    };
    
    await Fine.create({
      membre: user._id,
      typeAmende: amende.type,
      montant: amende.montant,
      motif: motifMap[amende.type] || 'autre',
      description: `Amende du ${amende.date}`,
      statut: amende.paye ? 'payee' : 'en_attente',
      datePaiement: amende.paye && amende.datePaiement ? new Date(amende.datePaiement) : null,
      automatique: false,
      createdAt: new Date(amende.date)
    });
    
    console.log(`✅ Amende créée pour ${amende.prenom}: ${amende.type} - ${amende.montant}$`);
    created++;
  }
  
  console.log(`\nRésumé: ${created} amendes créées, ${errors} erreurs`);
  mongoose.disconnect();
}).catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});

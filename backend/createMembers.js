const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const membres = [
  { prenom: 'Rodevine', nom: 'Membre', email: 'rodevine@regioconnect.com', role: 'membre' },
  { prenom: 'Dominique', nom: 'Membre', email: 'dominique@regioconnect.com', role: 'membre' },
  { prenom: 'Achille', nom: 'Membre', email: 'achille@regioconnect.com', role: 'membre' },
  { prenom: 'Rikiel', nom: 'Membre', email: 'rikiel@regioconnect.com', role: 'membre' },
  { prenom: 'Carelle', nom: 'Membre', email: 'carelle@regioconnect.com', role: 'membre' },
  { prenom: 'Arthur', nom: 'Membre', email: 'arthur@regioconnect.com', role: 'membre' },
  { prenom: 'Priscille', nom: 'Membre', email: 'priscille@regioconnect.com', role: 'membre' },
  { prenom: 'Linus', nom: 'Membre', email: 'linus@regioconnect.com', role: 'membre' },
  { prenom: 'Felicite', nom: 'Membre', email: 'felicite@regioconnect.com', role: 'membre' },
  { prenom: 'Onyx', nom: 'Membre', email: 'onyx@regioconnect.com', role: 'membre' },
  { prenom: 'Maniche', nom: 'Membre', email: 'maniche@regioconnect.com', role: 'membre' },
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connexion MongoDB OK');
  
  for (const membre of membres) {
    const exists = await User.findOne({ 
      prenom: { $regex: new RegExp(`^${membre.prenom}`, 'i') }
    });
    
    if (exists) {
      // Mettre à jour le mot de passe du membre existant
      exists.password = 'password123';
      await exists.save();
      console.log(`🔄 Mot de passe mis à jour pour ${membre.prenom}`);
      continue;
    }
    
    await User.create({
      ...membre,
      password: 'password123',
      actif: true
    });
    
    console.log(`✅ ${membre.prenom} créé`);
  }
  
  console.log('\nMembres avec mot de passe: password123');
  mongoose.disconnect();
}).catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});

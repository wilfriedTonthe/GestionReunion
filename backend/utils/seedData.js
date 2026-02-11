const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Meeting = require('../models/Meeting');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/regioconnect');
    console.log('✅ Connecté à MongoDB');

    await User.deleteMany({});
    await Meeting.deleteMany({});
    console.log('🗑️ Base de données nettoyée');

    const users = await User.create([
      {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'president@regioconnect.com',
        password: 'password123',
        role: 'president',
        telephone: '+237 699 000 001'
      },
      {
        nom: 'Martin',
        prenom: 'Marie',
        email: 'tresorier@regioconnect.com',
        password: 'password123',
        role: 'tresorier',
        telephone: '+237 699 000 002'
      },
      {
        nom: 'Bernard',
        prenom: 'Pierre',
        email: 'censeur@regioconnect.com',
        password: 'password123',
        role: 'censeur',
        telephone: '+237 699 000 003'
      },
      {
        nom: 'Petit',
        prenom: 'Sophie',
        email: 'membre@regioconnect.com',
        password: 'password123',
        role: 'membre',
        telephone: '+237 699 000 004'
      }
    ]);

    console.log('👥 Utilisateurs créés:', users.length);

    const president = users.find(u => u.role === 'president');

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await Meeting.create({
      titre: 'Assemblée Générale Mensuelle',
      description: 'Réunion mensuelle pour discuter des affaires courantes de l\'organisation.',
      date: nextWeek,
      heureDebut: '14:00',
      heureFin: '17:00',
      lieu: {
        nom: 'Salle des Fêtes',
        adresse: '123 Rue Principale, Douala',
        coordinates: {
          latitude: 4.0511,
          longitude: 9.7679
        }
      },
      creePar: president._id
    });

    console.log('📅 Réunion de démonstration créée');

    console.log('\n✅ Base de données initialisée avec succès!');
    console.log('\n📧 Comptes de test:');
    console.log('   Président: president@regioconnect.com / password123');
    console.log('   Trésorier: tresorier@regioconnect.com / password123');
    console.log('   Censeur: censeur@regioconnect.com / password123');
    console.log('   Membre: membre@regioconnect.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

seedDatabase();

require('dotenv').config();
const mongoose = require('mongoose');
const Meeting = require('./models/Meeting');
const User = require('./models/User');

// Fonction pour obtenir le dernier samedi du mois
const getLastSaturday = (year, month) => {
  const lastDay = new Date(year, month + 1, 0); // Dernier jour du mois
  const dayOfWeek = lastDay.getDay();
  const diff = dayOfWeek >= 6 ? dayOfWeek - 6 : dayOfWeek + 1;
  lastDay.setDate(lastDay.getDate() - diff);
  return lastDay;
};

const createMeetings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');

    // Trouver le président pour créer les réunions
    const president = await User.findOne({ role: 'president' });
    if (!president) {
      console.log('❌ Aucun président trouvé');
      await mongoose.disconnect();
      return;
    }

    const year = 2026;
    
    // Réunions avec hôtes en duo (dernier samedi de chaque mois)
    const reunions = [
      // Janvier déjà passé (Assemblée Générale)
      { mois: 1, hotes: 'Rikiel & Dominique', titre: 'Réunion Mensuelle - Février' },
      { mois: 2, hotes: 'Rodevine & Onyx', titre: 'Réunion Mensuelle - Mars' },
      { mois: 3, hotes: 'Carelle & Achille', titre: 'Réunion Mensuelle - Avril' },
      { mois: 4, hotes: 'Wilfried & Maniche', titre: 'Réunion Mensuelle - Mai' },
    ];

    console.log('\n📅 Création des réunions...\n');

    for (const reunion of reunions) {
      const date = getLastSaturday(year, reunion.mois);
      
      // Vérifier si la réunion existe déjà
      const existingMeeting = await Meeting.findOne({
        titre: reunion.titre,
        date: {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      });

      if (existingMeeting) {
        console.log(`  ⏭️  ${reunion.titre} existe déjà (${date.toLocaleDateString('fr-FR')})`);
        continue;
      }

      const meeting = await Meeting.create({
        titre: reunion.titre,
        description: `Réunion mensuelle reçue par ${reunion.hotes}`,
        date: date,
        heureDebut: '19:30',
        heureFin: '22:00',
        lieu: {
          nom: `Chez ${reunion.hotes.split(' & ')[0]}`,
          adresse: 'À confirmer',
          coordinates: { latitude: 45.5017, longitude: -73.5673 } // Montréal par défaut
        },
        rayonPointage: 1000,
        creePar: president._id,
        statut: 'planifiee'
      });

      console.log(`  ✅ ${reunion.titre} - ${date.toLocaleDateString('fr-FR')} (Hôtes: ${reunion.hotes})`);
    }

    console.log('\n✅ Réunions créées avec succès!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createMeetings();

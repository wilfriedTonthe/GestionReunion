require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { sendBirthdayReminder } = require('./utils/emailService');

const sendAllUpcomingBirthdayReminders = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');

    const users = await User.find({ actif: true });
    console.log(`📋 ${users.length} membres actifs trouvés`);

    const today = new Date();
    const currentYear = today.getFullYear();

    const upcomingBirthdays = [];

    for (const user of users) {
      if (!user.dateNaissance?.jour || !user.dateNaissance?.mois) continue;

      let birthdayThisYear = new Date(currentYear, user.dateNaissance.mois - 1, user.dateNaissance.jour);
      
      if (birthdayThisYear < today) {
        birthdayThisYear = new Date(currentYear + 1, user.dateNaissance.mois - 1, user.dateNaissance.jour);
      }

      const diffTime = birthdayThisYear - today;
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysUntil >= 0 && daysUntil <= 7) {
        upcomingBirthdays.push({
          user,
          daysUntil,
          birthdayPerson: {
            prenom: user.prenom,
            nom: user.nom,
            jour: user.dateNaissance.jour,
            mois: user.dateNaissance.mois,
            email: user.email
          }
        });
      }
    }

    console.log(`\n🎂 ${upcomingBirthdays.length} anniversaire(s) dans les 7 prochains jours:\n`);

    if (upcomingBirthdays.length === 0) {
      console.log('Aucun anniversaire proche.');
      await mongoose.disconnect();
      return;
    }

    // Afficher les anniversaires trouvés
    for (const birthday of upcomingBirthdays) {
      let timeText;
      if (birthday.daysUntil === 0) {
        timeText = "AUJOURD'HUI";
      } else if (birthday.daysUntil === 1) {
        timeText = "DEMAIN";
      } else {
        timeText = `dans ${birthday.daysUntil} jours`;
      }
      console.log(`  🎂 ${birthday.birthdayPerson.prenom} ${birthday.birthdayPerson.nom} - ${birthday.birthdayPerson.jour}/${birthday.birthdayPerson.mois} (${timeText})`);
    }

    // Envoyer les rappels
    const recipients = users.filter(u => u.email && u.actif);
    console.log(`\n📧 Envoi des rappels à ${recipients.length} membres...\n`);

    for (const birthday of upcomingBirthdays) {
      const recipientsWithoutBirthdayPerson = recipients.filter(
        r => r._id.toString() !== birthday.user._id.toString()
      );

      console.log(`  Envoi rappel pour ${birthday.birthdayPerson.prenom} ${birthday.birthdayPerson.nom}...`);
      await sendBirthdayReminder(recipientsWithoutBirthdayPerson, birthday.birthdayPerson, birthday.daysUntil);
      console.log(`  ✅ Rappel envoyé à ${recipientsWithoutBirthdayPerson.length} membres`);
    }

    console.log('\n✅ Tous les rappels ont été envoyés!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

sendAllUpcomingBirthdayReminders();

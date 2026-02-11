const cron = require('node-cron');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const { sendBirthdayReminder, sendBirthdayReminderToSelf, sendMeetingReminder } = require('./emailService');

const checkBirthdayReminders = async () => {
  try {
    const users = await User.find({
      actif: true,
      'dateNaissance.jour': { $exists: true },
      'dateNaissance.mois': { $exists: true }
    });

    const today = new Date();
    const currentYear = today.getFullYear();

    for (const user of users) {
      const { jour, mois } = user.dateNaissance;
      const thisYearBirthday = new Date(currentYear, mois - 1, jour);
      const nextYearBirthday = new Date(currentYear + 1, mois - 1, jour);
      
      let targetBirthday = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday;
      const daysUntil = Math.ceil((targetBirthday - today) / (1000 * 60 * 60 * 24));

      const rappels = user.rappelsAnniversaireEnvoyes || {};
      const rappelAnnee = rappels.annee || 0;

      if (rappelAnnee !== currentYear) {
        user.rappelsAnniversaireEnvoyes = {
          unMois: false,
          septJours: false,
          veille: false,
          annee: currentYear
        };
      }

      const allMembers = await User.find({ actif: true, _id: { $ne: user._id } });

      if (daysUntil === 30 && !user.rappelsAnniversaireEnvoyes?.unMois) {
        await sendBirthdayReminder(allMembers, { ...user.toObject(), jour, mois }, daysUntil);
        user.rappelsAnniversaireEnvoyes.unMois = true;
        await user.save();
        console.log(`Rappel 1 mois envoyé aux membres pour ${user.prenom} ${user.nom}`);
      }

      if (daysUntil === 7 && !user.rappelsAnniversaireEnvoyes?.septJours) {
        await sendBirthdayReminder(allMembers, { ...user.toObject(), jour, mois }, daysUntil);
        user.rappelsAnniversaireEnvoyes.septJours = true;
        await user.save();
        console.log(`Rappel 7 jours envoyé aux membres pour ${user.prenom} ${user.nom}`);
      }

      if (daysUntil === 1 && !user.rappelsAnniversaireEnvoyes?.veille) {
        await sendBirthdayReminder(allMembers, { ...user.toObject(), jour, mois }, daysUntil);
        user.rappelsAnniversaireEnvoyes.veille = true;
        await user.save();
        console.log(`Rappel veille envoyé aux membres pour ${user.prenom} ${user.nom}`);
      }

      if (daysUntil === 0) {
        await sendBirthdayReminder(allMembers, { ...user.toObject(), jour, mois }, daysUntil);
        await sendBirthdayReminderToSelf({ ...user.toObject(), jour, mois }, daysUntil);
        console.log(`🎂 Joyeux anniversaire envoyé à ${user.prenom} ${user.nom} + notification aux membres`);
      }
    }
  } catch (error) {
    console.error('Erreur vérification anniversaires:', error.message);
  }
};

const checkMeetingReminders = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const meetings = await Meeting.find({
      statut: 'planifiee',
      date: { $gte: today }
    });

    const allMembers = await User.find({ actif: true });

    for (const meeting of meetings) {
      const meetingDate = new Date(meeting.date);
      meetingDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((meetingDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntil === 7 || daysUntil === 1 || daysUntil === 0) {
        await sendMeetingReminder(allMembers, meeting, daysUntil);
        console.log(`Rappel réunion "${meeting.titre}" envoyé (${daysUntil} jours)`);
      }
    }
  } catch (error) {
    console.error('Erreur vérification réunions:', error.message);
  }
};

const autoStartMeetings = async () => {
  try {
    // Utiliser le fuseau horaire UTC-5 (Montréal)
    const now = new Date();
    const offsetMs = -5 * 60 * 60 * 1000;
    const localNow = new Date(now.getTime() + offsetMs + now.getTimezoneOffset() * 60 * 1000);
    
    const currentHour = localNow.getHours();
    const currentMinute = localNow.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    const today = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());

    const meetings = await Meeting.find({
      statut: 'planifiee'
    });

    for (const meeting of meetings) {
      const meetingDate = new Date(meeting.date);
      meetingDate.setHours(0, 0, 0, 0);
      
      // Vérifier si c'est le jour de la réunion et l'heure de début
      if (meetingDate.getTime() === today.getTime() && meeting.heureDebut === currentTimeStr) {
        meeting.statut = 'en_cours';
        await meeting.save();
        console.log(`🚀 Réunion "${meeting.titre}" démarrée automatiquement à ${currentTimeStr}`);
      }
    }
  } catch (error) {
    console.error('Erreur démarrage auto réunions:', error.message);
  }
};

const startReminderScheduler = () => {
  // Rappels quotidiens à 8h
  cron.schedule('0 8 * * *', async () => {
    console.log('Exécution des rappels quotidiens...');
    await checkBirthdayReminders();
    await checkMeetingReminders();
  });

  // Vérification toutes les minutes pour démarrage auto des réunions
  cron.schedule('* * * * *', async () => {
    await autoStartMeetings();
  });

  console.log('Planificateur de rappels démarré (rappels à 8h, démarrage auto chaque minute)');
};

module.exports = {
  startReminderScheduler,
  checkBirthdayReminders,
  checkMeetingReminders,
  autoStartMeetings
};

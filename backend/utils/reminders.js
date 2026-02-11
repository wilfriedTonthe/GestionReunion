const Meeting = require('../models/Meeting');
const User = require('../models/User');

const sendMeetingReminders = async () => {
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const meetingsJ7 = await Meeting.find({
      date: {
        $gte: new Date(in7Days.setHours(0, 0, 0, 0)),
        $lt: new Date(in7Days.setHours(23, 59, 59, 999))
      },
      statut: 'planifiee',
      rappelJ7Envoye: false
    });

    for (const meeting of meetingsJ7) {
      console.log(`📧 Rappel J-7 pour: ${meeting.titre}`);
      meeting.rappelJ7Envoye = true;
      await meeting.save();
    }

    const meetingsJourJ = await Meeting.find({
      date: {
        $gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
        $lt: new Date(tomorrow.setHours(23, 59, 59, 999))
      },
      statut: 'planifiee',
      rappelJourJEnvoye: false
    });

    for (const meeting of meetingsJourJ) {
      console.log(`📧 Rappel Jour J pour: ${meeting.titre}`);
      meeting.rappelJourJEnvoye = true;
      await meeting.save();
    }

    console.log(`✅ Rappels traités: ${meetingsJ7.length} J-7, ${meetingsJourJ.length} Jour J`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi des rappels:', error);
  }
};

module.exports = { sendMeetingReminders };

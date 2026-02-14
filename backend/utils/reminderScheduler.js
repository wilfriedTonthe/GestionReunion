const cron = require('node-cron');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const Loan = require('../models/Loan');
const Fine = require('../models/Fine');
const Announcement = require('../models/Announcement');
const { sendBirthdayReminder, sendBirthdayReminderToSelf, sendMeetingReminder, sendEmail } = require('./emailService');

const PENALITE_RETARD_PRET = 10; // 10$ tous les 7 jours de retard

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
    
    const today = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
    const currentMinutes = localNow.getHours() * 60 + localNow.getMinutes();

    const meetings = await Meeting.find({
      statut: 'planifiee'
    });

    for (const meeting of meetings) {
      const meetingDate = new Date(meeting.date);
      meetingDate.setHours(0, 0, 0, 0);
      
      // Vérifier si c'est le jour de la réunion
      if (meetingDate.getTime() === today.getTime()) {
        // Convertir l'heure de début en minutes
        const [heureDebut, minuteDebut] = meeting.heureDebut.split(':').map(Number);
        const meetingStartMinutes = heureDebut * 60 + minuteDebut;
        
        // Démarrer 30 minutes avant l'heure de début
        const startTime = meetingStartMinutes - 30;
        
        if (currentMinutes >= startTime) {
          meeting.statut = 'en_cours';
          await meeting.save();
          console.log(`🚀 Réunion "${meeting.titre}" démarrée automatiquement (30 min avant ${meeting.heureDebut})`);
        }
      }
    }
  } catch (error) {
    console.error('Erreur démarrage auto réunions:', error.message);
  }
};

// Vérifier les pénalités de retard sur les prêts (10$ tous les 7 jours)
const checkLoanPenalties = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const loansEnRetard = await Loan.find({
      statut: 'en_cours',
      dateRemboursementPrevue: { $lt: today }
    }).populate('demandeur', 'nom prenom email');

    for (const loan of loansEnRetard) {
      const dateEcheance = new Date(loan.dateRemboursementPrevue);
      dateEcheance.setHours(0, 0, 0, 0);
      
      const joursRetard = Math.floor((today - dateEcheance) / (1000 * 60 * 60 * 24));
      const nombrePenalites = Math.floor(joursRetard / 7);
      
      // Calculer les pénalités déjà appliquées
      const penalitesExistantes = loan.penalites || 0;
      const penalitesAttendues = nombrePenalites * PENALITE_RETARD_PRET;
      
      if (penalitesAttendues > penalitesExistantes) {
        const nouvellePenalite = penalitesAttendues - penalitesExistantes;
        
        // Mettre à jour le prêt
        loan.penalites = penalitesAttendues;
        loan.montantTotal = loan.montant + loan.interet + penalitesAttendues;
        await loan.save();
        
        // Créer une amende pour la pénalité
        await Fine.create({
          membre: loan.demandeur._id,
          typeAmende: 'retard_pret',
          montant: nouvellePenalite,
          motif: 'retard_pret',
          description: `Pénalité de retard sur prêt (${joursRetard} jours de retard)`,
          automatique: true
        });
        
        // Notifier le membre
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #ef4444; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">⚠️ Pénalité de Retard</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151;">
                Bonjour <strong>${loan.demandeur.prenom}</strong>,
              </p>
              <p style="font-size: 16px; color: #374151;">
                Votre prêt de <strong>${loan.montant}$</strong> est en retard de <strong>${joursRetard} jours</strong>.
              </p>
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <p style="color: #991b1b; margin: 0;">
                  Une pénalité de <strong>${nouvellePenalite}$</strong> a été ajoutée à votre prêt.
                </p>
                <p style="color: #991b1b; margin-top: 10px; margin-bottom: 0;">
                  <strong>Nouveau total à rembourser: ${loan.montantTotal}$</strong>
                </p>
              </div>
              <p style="font-size: 14px; color: #6b7280;">
                Veuillez régulariser votre situation au plus vite pour éviter d'autres pénalités.
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                — L'équipe Unit Solidarité
              </p>
            </div>
          </div>
        `;
        await sendEmail(loan.demandeur.email, '⚠️ Pénalité de retard sur votre prêt - Unit Solidarité', html);
        
        console.log(`⚠️ Pénalité de ${nouvellePenalite}$ ajoutée au prêt de ${loan.demandeur.prenom} ${loan.demandeur.nom} (${joursRetard} jours de retard)`);
      }
    }
  } catch (error) {
    console.error('Erreur vérification pénalités prêts:', error.message);
  }
};

// Envoyer les emails de notification pour les nouveaux prêts
const sendPendingLoanNotifications = async () => {
  try {
    // Trouver les prêts qui n'ont pas encore reçu leur notification
    const loansToNotify = await Loan.find({
      emailNotificationEnvoye: false
    }).populate('demandeur', 'nom prenom email');

    if (loansToNotify.length === 0) return;

    const tresorier = await User.findOne({ role: 'tresorier', actif: true });

    for (const loan of loansToNotify) {
      let emailsSent = 0;

      // Email au trésorier
      if (tresorier) {
        const htmlTresorier = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #6366f1; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">💰 Nouvelle Demande de Prêt</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151;">
                <strong>${loan.demandeur.prenom} ${loan.demandeur.nom}</strong> a soumis une demande de prêt.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Montant demandé:</strong> ${loan.montant}$</p>
                <p><strong>Intérêts (${loan.tauxInteret}%):</strong> ${loan.interet}$</p>
                <p><strong>Total à rembourser:</strong> ${loan.montantTotal}$</p>
                <p><strong>Motif:</strong> ${loan.motif}</p>
              </div>
              <p style="font-size: 14px; color: #6b7280;">
                Connectez-vous à l'application pour traiter cette demande.
              </p>
            </div>
          </div>
        `;
        const sent = await sendEmail(tresorier.email, `💰 Nouvelle demande de prêt - ${loan.demandeur.prenom} ${loan.demandeur.nom}`, htmlTresorier);
        if (sent) emailsSent++;
      }

      // Email au demandeur
      const htmlDemandeur = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #10b981; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Demande de Prêt Reçue</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151;">
              Bonjour <strong>${loan.demandeur.prenom}</strong>,
            </p>
            <p style="font-size: 16px; color: #374151;">
              Votre demande de prêt a bien été enregistrée.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p><strong>📋 Récapitulatif:</strong></p>
              <p>Montant emprunté: <strong>${loan.montant}$</strong></p>
              <p>Intérêts (${loan.tauxInteret}%): <strong>${loan.interet}$</strong></p>
              <p>Total à rembourser: <strong>${loan.montantTotal}$</strong></p>
              <p>Échéance: <strong>${new Date(loan.dateRemboursementPrevue).toLocaleDateString('fr-FR')}</strong></p>
            </div>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0;">
                <strong>⚠️ Attention:</strong> En cas de retard de remboursement, une pénalité de 10$ sera appliquée tous les 7 jours.
              </p>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              Le trésorier examinera votre demande et vous serez notifié de sa décision.
            </p>
          </div>
        </div>
      `;
      const sentDemandeur = await sendEmail(loan.demandeur.email, '✅ Confirmation de votre demande de prêt - Unit Solidarité', htmlDemandeur);
      if (sentDemandeur) emailsSent++;

      // Marquer comme envoyé si au moins un email est parti
      if (emailsSent > 0) {
        await Loan.findByIdAndUpdate(loan._id, { emailNotificationEnvoye: true });
        console.log(`📧 Notifications prêt envoyées pour ${loan.demandeur.prenom} ${loan.demandeur.nom} (${emailsSent} emails)`);
      }
    }
  } catch (error) {
    console.error('Erreur envoi notifications prêts:', error.message);
  }
};

// Envoyer les emails de notification pour les nouveaux communiqués
const sendPendingAnnouncementNotifications = async () => {
  try {
    // Trouver les communiqués qui n'ont pas encore reçu leur notification
    const announcementsToNotify = await Announcement.find({
      emailEnvoye: false,
      envoyerEmail: true
    }).populate('creePar', 'nom prenom email');

    if (announcementsToNotify.length === 0) return;

    const allMembers = await User.find({ actif: true });

    const typeLabels = {
      info: 'ℹ️ Information',
      urgent: '🚨 Urgent',
      rappel: '🔔 Rappel',
      evenement: '🎉 Événement'
    };

    const typeColors = {
      info: '#3b82f6',
      urgent: '#ef4444',
      rappel: '#f59e0b',
      evenement: '#10b981'
    };

    for (const announcement of announcementsToNotify) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${typeColors[announcement.type] || '#6366f1'}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">${typeLabels[announcement.type] || 'Communiqué'}</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-top: 0;">${announcement.titre}</h2>
            <div style="font-size: 16px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${announcement.contenu}</div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              Publié par ${announcement.creePar.prenom} ${announcement.creePar.nom}<br>
              — L'équipe Unit Solidarité
            </p>
          </div>
        </div>
      `;

      let emailsSent = 0;
      for (const member of allMembers) {
        const sent = await sendEmail(member.email, `${typeLabels[announcement.type] || 'Communiqué'} - ${announcement.titre}`, html);
        if (sent) emailsSent++;
      }

      // Envoyer confirmation à l'expéditeur
      const htmlConfirmation = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #10b981; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Communiqué Envoyé</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151;">
              Bonjour <strong>${announcement.creePar.prenom}</strong>,
            </p>
            <p style="font-size: 16px; color: #374151;">
              Votre communiqué a été envoyé avec succès à <strong>${emailsSent} membre(s)</strong>.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p><strong>Titre:</strong> ${announcement.titre}</p>
              <p><strong>Type:</strong> ${typeLabels[announcement.type] || 'Communiqué'}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              — L'équipe Unit Solidarité
            </p>
          </div>
        </div>
      `;
      await sendEmail(announcement.creePar.email, `✅ Confirmation - Communiqué "${announcement.titre}" envoyé`, htmlConfirmation);

      // Marquer comme envoyé
      await Announcement.findByIdAndUpdate(announcement._id, { emailEnvoye: true });
      console.log(`📢 Communiqué "${announcement.titre}" envoyé à ${emailsSent} membres + confirmation à ${announcement.creePar.email}`);
    }
  } catch (error) {
    console.error('Erreur envoi notifications communiqués:', error.message);
  }
};

const startReminderScheduler = () => {
  // Rappels quotidiens à 8h
  cron.schedule('0 8 * * *', async () => {
    console.log('Exécution des rappels quotidiens...');
    await checkBirthdayReminders();
    await checkMeetingReminders();
    await checkLoanPenalties();
  });

  // Vérification toutes les minutes pour démarrage auto des réunions et notifications
  cron.schedule('* * * * *', async () => {
    await autoStartMeetings();
    await sendPendingLoanNotifications();
    await sendPendingAnnouncementNotifications();
  });

  console.log('Planificateur de rappels démarré (rappels à 8h, notifications chaque minute)');
};

module.exports = {
  startReminderScheduler,
  checkBirthdayReminders,
  checkMeetingReminders,
  autoStartMeetings,
  checkLoanPenalties
};

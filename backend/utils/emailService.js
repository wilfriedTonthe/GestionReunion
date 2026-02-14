const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Email non envoyé (RESEND_API_KEY non configuré):', { to, subject });
      return false;
    }

    await resend.emails.send({
      from: 'Unit Solidarité <onboarding@resend.dev>',
      to: to,
      subject: subject,
      html: html
    });
    console.log('Email envoyé à:', to);
    return true;
  } catch (error) {
    console.error('Erreur envoi email:', error.message);
    return false;
  }
};

const sendBirthdayReminder = async (recipients, birthdayPerson, daysUntil) => {
  let timeText;
  if (daysUntil === 0) {
    timeText = "aujourd'hui";
  } else if (daysUntil === 1) {
    timeText = "demain";
  } else if (daysUntil <= 7) {
    timeText = `dans ${daysUntil} jours`;
  } else {
    timeText = `dans ${daysUntil} jours (environ 1 mois)`;
  }

  const subject = `🎂 Anniversaire de ${birthdayPerson.prenom} ${birthdayPerson.nom} ${timeText}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">🎂 Rappel Anniversaire</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #374151;">Bonjour,</p>
        <p style="font-size: 16px; color: #374151;">
          N'oubliez pas que <strong>${birthdayPerson.prenom} ${birthdayPerson.nom}</strong> fête son anniversaire <strong>${timeText}</strong> !
        </p>
        <p style="font-size: 16px; color: #374151;">
          📅 Date : ${birthdayPerson.jour}/${birthdayPerson.mois}
        </p>
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          — L'équipe Unit Solidarité
        </p>
      </div>
    </div>
  `;

  for (const recipient of recipients) {
    await sendEmail(recipient.email, subject, html);
  }
};

const sendBirthdayReminderToSelf = async (birthdayPerson, daysUntil) => {
  const subject = `🎉🎂 Joyeux Anniversaire ${birthdayPerson.prenom} ! 🎂🎉`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); padding: 40px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Joyeux Anniversaire ! 🎉</h1>
        <p style="color: white; margin-top: 10px; font-size: 24px;">${birthdayPerson.prenom} ${birthdayPerson.nom}</p>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; text-align: center;">
        <div style="font-size: 60px; margin: 20px 0;">🎂🎈🎁</div>
        <p style="font-size: 20px; color: #374151; line-height: 1.6;">
          Cher(e) <strong>${birthdayPerson.prenom}</strong>,
        </p>
        <p style="font-size: 18px; color: #374151; line-height: 1.6;">
          En ce jour spécial, tous les membres de <strong>Unit Solidarité</strong> se joignent à moi pour te souhaiter un très <strong>JOYEUX ANNIVERSAIRE</strong> ! 🎊
        </p>
        <div style="background: white; padding: 20px; border-radius: 10px; margin: 25px 0; border: 2px solid #ec4899;">
          <p style="font-size: 16px; color: #374151; font-style: italic; margin: 0;">
            "Que cette nouvelle année de vie t'apporte joie, bonheur, santé et prospérité. Que tous tes rêves se réalisent et que tu continues à illuminer notre association par ta présence."
          </p>
        </div>
        <p style="font-size: 16px; color: #6b7280;">
          Nous avons hâte de célébrer ce moment avec toi lors de notre prochaine réunion ! 🥳
        </p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #9ca3af; margin: 0;">
            Avec toute notre affection,
          </p>
          <p style="font-size: 16px; color: #374151; font-weight: bold; margin: 5px 0;">
            L'Association Unit Solidarité 💜
          </p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(birthdayPerson.email, subject, html);
};

const sendMeetingReminder = async (recipients, meeting, daysUntil) => {
  let timeText;
  if (daysUntil === 0) {
    timeText = "aujourd'hui";
  } else if (daysUntil === 1) {
    timeText = "demain";
  } else if (daysUntil === 7) {
    timeText = "dans 7 jours";
  } else {
    timeText = `dans ${daysUntil} jours`;
  }

  const subject = `📅 Rappel : Réunion "${meeting.titre}" ${timeText}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">📅 Rappel de Réunion</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #374151;">Bonjour,</p>
        <p style="font-size: 16px; color: #374151;">
          N'oubliez pas la réunion <strong>"${meeting.titre}"</strong> qui a lieu <strong>${timeText}</strong>.
        </p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 5px 0; color: #374151;"><strong>📅 Date :</strong> ${new Date(meeting.date).toLocaleDateString('fr-FR')}</p>
          <p style="margin: 5px 0; color: #374151;"><strong>🕐 Heure :</strong> ${meeting.heureDebut}</p>
          <p style="margin: 5px 0; color: #374151;"><strong>📍 Lieu :</strong> ${meeting.lieu?.nom || 'À définir'}</p>
          ${meeting.lieu?.adresse ? `<p style="margin: 5px 0; color: #6b7280;">${meeting.lieu.adresse}</p>` : ''}
        </div>
        <p style="font-size: 14px; color: #ef4444;">
          ⚠️ Rappel : L'heure de convocation est 19h30 précises. Tout retard sera sanctionné selon le barème en vigueur.
        </p>
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          — L'équipe Unit Solidarité
        </p>
      </div>
    </div>
  `;

  for (const recipient of recipients) {
    await sendEmail(recipient.email, subject, html);
  }
};

const checkAndNotifyNewMemberBirthday = async (newMember, allMembers) => {
  if (!newMember.dateNaissance?.jour || !newMember.dateNaissance?.mois) {
    return false;
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  
  let birthdayThisYear = new Date(currentYear, newMember.dateNaissance.mois - 1, newMember.dateNaissance.jour);
  
  if (birthdayThisYear < today) {
    birthdayThisYear = new Date(currentYear + 1, newMember.dateNaissance.mois - 1, newMember.dateNaissance.jour);
  }
  
  const diffTime = birthdayThisYear - today;
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (daysUntil <= 7 && daysUntil >= 0) {
    const recipients = allMembers.filter(m => 
      m._id.toString() !== newMember._id.toString() && 
      m.email && 
      m.actif
    );
    
    if (recipients.length > 0) {
      const birthdayPerson = {
        prenom: newMember.prenom,
        nom: newMember.nom,
        jour: newMember.dateNaissance.jour,
        mois: newMember.dateNaissance.mois
      };
      
      await sendBirthdayReminder(recipients, birthdayPerson, daysUntil);
      console.log(`Notification anniversaire envoyée pour nouveau membre ${newMember.prenom} (dans ${daysUntil} jours)`);
      return true;
    }
  }
  
  return false;
};

module.exports = {
  sendEmail,
  sendBirthdayReminder,
  sendBirthdayReminderToSelf,
  sendMeetingReminder,
  checkAndNotifyNewMemberBirthday
};

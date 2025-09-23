import nodemailer from 'nodemailer';

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

async function sendValidationEmail(to, token) {
  // Désactiver les emails pendant les tests
  if (process.env.NODE_ENV === 'test') {
    console.log(`[TEST MODE] Email de validation simulé pour ${to} avec le token ${token}`);
    return { success: true, message: 'Email simulé en mode test' };
  }

  const validationUrl = `${FRONT_URL}/validate/${token}`;
  // Configure Nodemailer avec Mailtrap depuis les variables d'environnement
  const transport = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.MAILTRAP_PORT) || 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS
    }
  });  
  console.log(`Envoi de l'email de validation à ${to} avec le transport`, transport); 
  await transport.sendMail({
    from: '"Chat-app" <no-reply@monapp.com>',
    to,
    subject: 'Validez votre compte',
    html: `<p>Merci pour votre inscription sur chat-app. Cliquez sur le lien suivant pour valider votre compte :</p>
           <p><a href="${validationUrl}">${validationUrl}</a></p>`
  });
  console.log(`Email de validation envoyé à ${to}`);
}
async function sendResetPasswordEmail(to, token) {
  // Désactiver les emails pendant les tests
  if (process.env.NODE_ENV === 'test') {
    console.log(`[TEST MODE] Email de réinitialisation simulé pour ${to} avec le token ${token}`);
    return { success: true, message: 'Email simulé en mode test' };
  }

  const resetUrl = `${FRONT_URL}/resetPassword/${token}`;
    // Configure Nodemailer avec Mailtrap depuis les variables d'environnement
    const transport = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.MAILTRAP_PORT) || 2525,
    auth: { 
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
    }
  });  
  console.log(`Envoi de l'email de réinitialisation à ${to} avec le transport`, transport); 
  await transport.sendMail({
    from: '"Chat-app" <no-reply@monapp.com>',
    to,
    subject: 'Réinitialisation du mot de passe',
    html: `<p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>`
  });
  console.log(`Email de réinitialisation envoyé à ${to}`);
}

export { sendValidationEmail, sendResetPasswordEmail };

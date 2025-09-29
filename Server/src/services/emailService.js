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
    from: '"Yanotela." <no-reply@yanotela.com>',
    to,
    subject: 'Validez votre compte',
    html: `
      <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 30px;">
        <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 24px;">
          <h2 style="color: #882626; margin-top: 0;">Bienvenue sur Yanotela. !</h2>
          <p>Merci pour votre inscription. Pour valider votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${validationUrl}" style="background: #882626; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block;">
              Valider mon compte
            </a>
          </p>
          <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all;"><a href="${validationUrl}">${validationUrl}</a></p>
          <hr style="margin: 32px 0;">
          <p style="font-size: 12px; color: #888;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    `
  });
  console.log(`Email de validation envoyé à ${to}`);
}
async function sendResetPasswordEmail(to, token) {
  // Désactiver les emails pendant les tests
  if (process.env.NODE_ENV === 'test') {
    console.log(`[TEST MODE] Email de réinitialisation simulé pour ${to} avec le token ${token}`);
    return { success: true, message: 'Email simulé en mode test' };
  }

  const resetUrl = `${FRONT_URL}/forgot-password/${token}`;
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
    from: '"Yanotela." <no-reply@yanotela.com>',
    to,
    subject: 'Réinitialisation du mot de passe',
    html: `
      <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 30px;">
        <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 24px;">
          <h2 style="color: #882626; margin-top: 0;">Réinitialisation du mot de passe</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Pour continuer, veuillez cliquer sur le bouton ci-dessous :</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #882626; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
          <hr style="margin: 32px 0;">
          <p style="font-size: 12px; color: #888;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    `
  });
  console.log(`Email de réinitialisation envoyé à ${to}`);
}

export { sendValidationEmail, sendResetPasswordEmail };

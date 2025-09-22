import nodemailer from 'nodemailer';

async function sendValidationEmail(to, token) {
  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
  const validationUrl = `${SERVER_URL}/validate/${token}`;
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

export { sendValidationEmail };

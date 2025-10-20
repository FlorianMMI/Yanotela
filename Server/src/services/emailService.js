import nodemailer from 'nodemailer';

const FRONT_URL = process.env.FRONT_URL || 'http://15236.208.91';

// Configuration du transporteur email
function createEmailTransporter() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 DEBUG VARIABLES ENVIRONNEMENT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
  console.log('GMAIL_USER:', process.env.GMAIL_USER);
  console.log('GMAIL_APP_PASSWORD existe:', !!process.env.GMAIL_APP_PASSWORD);
  console.log('GMAIL_APP_PASSWORD longueur:', process.env.GMAIL_APP_PASSWORD?.length);
  
  // Vérifier si les variables sont définies
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('❌ ERREUR: Variables d\'environnement manquantes!');
    console.error('GMAIL_USER:', process.env.GMAIL_USER);
    console.error('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'défini' : 'MANQUANT');
    throw new Error('Variables d\'environnement EMAIL manquantes');
  }
  
  console.log('✅ Variables OK, création du transporter...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    debug: true,   // Active le mode debug
    logger: true   // Active les logs SMTP
  });
}

// Test de la fonction
async function testTransporter() {
  try {
    const transporter = createEmailTransporter();
    console.log('🔌 Test de connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie!\n');
    return transporter;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

// Appeler le test au démarrage
testTransporter().catch(console.error);

async function sendValidationEmail(to, token) {
  // Désactiver les emails pendant les tests
  
  const validationUrl = `${FRONT_URL}/validate/${token}`;
  
  // Créer le transporteur email
  const transport = createEmailTransporter();
  if (!transport) {
    throw new Error('Impossible de créer le transporteur email');
  }

  try {
    // Vérifier la configuration du transporteur
    await transport.verify();

    // Configurer l'expéditeur selon le service
    const fromAddress = process.env.EMAIL_SERVICE === 'gmail' 
      ? `"Yanotela" <${process.env.GMAIL_USER}>`
      : '"Yanotela" <no-reply@yanotela.com>';

    await transport.sendMail({
      from: fromAddress,
      to,
      subject: 'Validez votre compte Yanotela',
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 30px;">
          <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 24px;">
            <h2 style="color: #882626; margin-top: 0;">Bienvenue sur Yanotela !</h2>
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
    
    return { success: true, message: 'Email de validation envoyé avec succès' };
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de validation:', error);
    throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
  }
}

async function sendResetPasswordEmail(to, token) {
  // Désactiver les emails pendant les tests
  if (process.env.NODE_ENV === 'test') {
    return { success: true, message: 'Email simulé en mode test' };
  }

  const resetUrl = `${FRONT_URL}/forgot-password/${token}`;
  
  // Créer le transporteur email
  const transport = createEmailTransporter();
  if (!transport) {
    throw new Error('Impossible de créer le transporteur email');
  }

  try {
    // Vérifier la configuration du transporteur
    await transport.verify();

    // Configurer l'expéditeur selon le service
    const fromAddress = process.env.EMAIL_SERVICE === 'gmail' 
      ? `"Yanotela" <${process.env.GMAIL_USER}>`
      : '"Yanotela" <no-reply@yanotela.com>';

    await transport.sendMail({
      from: fromAddress,
      to,
      subject: 'Réinitialisation du mot de passe - Yanotela',
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
            <p><strong>Note :</strong> Ce lien expirera dans 1 heure pour votre sécurité.</p>
            <hr style="margin: 32px 0;">
            <p style="font-size: 12px; color: #888;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      `
    });
    
    return { success: true, message: 'Email de réinitialisation envoyé avec succès' };
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
    throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
  }
}

async function sendDeleteAccountEmail(to) {

  // transporter
  const transport = createEmailTransporter();
  if (!transport) {
    throw new Error('Impossible de créer le transporteur email');
  }
  try {
    // Vérifier la configuration du transporteur
    await transport.verify();
    
    // Configurer l'expéditeur selon le service
    const fromAddress =`"Yanotela" <${process.env.GMAIL_USER}>`;
    await transport.sendMail({
      from: fromAddress,
      to,
      subject: 'Votre compte Yanotela a été supprimé',
      html: `
      <span style="display:none; font-size:1px; color:#ffffff; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
      Confirmation de suppression de votre compte Yanotela
      </span>
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f6f8; padding:30px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 24px rgba(34,41,47,0.06);">
      
      <!-- Header -->
      <div style="background:linear-gradient(90deg,#882626 0%, #b03a3a 100%); padding:22px 24px; color:#fff; display:flex; align-items:center; gap:16px;">
      <div style="width:56px; height:56px; border-radius:50%; background:rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:20px; overflow:hidden;">
        <img src="${FRONT_URL}/favicon.ico" alt="Yanotela" style="width:40px; height:40px; object-fit:contain; display:block;" />
      </div>
      <div>
        <div style="font-size:18px; font-weight:700; letter-spacing:0.2px;">Yanotela</div>
        <div style="font-size:13px; opacity:0.9;">Confirmation de suppression de compte</div>
      </div>
      </div>

      <!-- Body -->
      <div style="padding:28px;">
      <h2 style="color:#222; margin:0 0 8px; font-size:20px;">Votre compte a bien été supprimé</h2>
      <p style="color:#495057; line-height:1.5; margin:0 0 18px;">
        Nous confirmons que votre compte Yanotela a été définitivement supprimé. Nous sommes désolés de vous voir partir.
      </p>

      <div style="background:#f8fafb; border:1px solid #eef2f4; padding:16px; border-radius:8px; margin-bottom:18px;">
        <p style="margin:0; color:#333; font-weight:600;">Ce que cela signifie</p>
        <ul style="margin:8px 0 0 18px; color:#555; line-height:1.45;">
        <li>Toutes vos notes et données associées ont été supprimées.</li>
        <li>Vous ne serez plus facturé (le cas échéant) et votre accès est révoqué.</li>
        <li>Si la suppression n'était pas intentionnelle, contactez-nous rapidement.</li>
        </ul>
      </div>

      <p style="margin:0 0 18px; color:#495057; line-height:1.5;">
        Si vous avez des questions, ou si cette suppression n'était pas autorisée, contactez notre équipe :
      </p>

      <div style="text-align:left; margin-bottom:22px;">
        <a href="mailto:${process.env.SUPPORT_EMAIL || 'noreply.yanotela@gmail.com'}" style="display:inline-block; background:#882626; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600;">
        Contacter le support
        </a>

        <a href="${FRONT_URL}" style="display:inline-block; margin-left:12px; background:#eef2f4; color:#222; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600;">
        Visiter Yanotela
        </a>
      </div>

      <p style="color:#9aa0a6; font-size:13px; margin:0;">
        Merci d'avoir essayé Yanotela — nous espérons vous revoir un jour.
      </p>
      </div>

      <!-- Footer -->
      <div style="background:#fafafa; padding:14px 20px; border-top:1px solid #eef2f4; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#8a8f94;">
      <div>Yanotela • <span style="color:#8a8f94;">&copy; ${new Date().getFullYear()}</span></div>
      <div>
        <a href="${FRONT_URL}/privacy" style="color:#8a8f94; text-decoration:none; margin-left:12px;">Confidentialité</a>
        <a href="${FRONT_URL}/terms" style="color:#8a8f94; text-decoration:none; margin-left:12px;">Conditions</a>
      </div>
      </div>

      </div>
      </div>
      `
    });
    
    return { success: true, message: 'Email de suppression de compte envoyé avec succès' };
    
  }catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de suppression de compte:', error);
      throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
    }
}

export { sendValidationEmail, sendResetPasswordEmail, sendDeleteAccountEmail };

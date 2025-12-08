import nodemailer from 'nodemailer';

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

// Configuration du transporteur email
function createEmailTransporter() {

  // Vérifier si les variables sont définies
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('❌ ERREUR: Variables d\'environnement manquantes!');
    console.error('GMAIL_USER:', process.env.GMAIL_USER);
    console.error('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'défini' : 'MANQUANT');
    throw new Error('Variables d\'environnement EMAIL manquantes');
  }

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
    
    await transporter.verify();

    return transporter;
  } catch (error) {
    console.error('❌ SMTP Erreur:', error.message);
    throw error;
  }
}

// Test SMTP en arrière-plan (non bloquant pour le démarrage du serveur)
setTimeout(() => {
  testTransporter().catch(error => {
    
  });
}, 1000);

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
        <span
          style="
            display: none;
            font-size: 1px;
            color: #ffffff;
            line-height: 1px;
            max-height: 0;
            max-width: 0;
            opacity: 0;
            overflow: hidden;
          "
        >
          Validation de votre compte Yanotela
        </span>
        <div
          style="
            font-family: Arial, Helvetica, sans-serif;
            background: #f4f6f8;
            padding: 30px;
          "
        >
          <div
            style="
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 6px 12px rgba(34, 41, 47, 0.2);
            "
          >
            <!-- Header -->
            <div
              style="
                background: #882626;
                padding: 22px 24px;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 16px;
                position: relative;
              "
            >
              <h1 
                style="
                  margin: 0;
                  font-size: 24px;
                  font-weight: 700;
                  line-height: 1.2;
                  max-width: 80%;
                "
              >
                Bienvenue sur Yanotela
              </h1>
              <svg 
                style="
                  position:absolute;
                  right: 24px;
                  top: 22px;
                  height: 80px;
                  width: 80px;
                "
                width="145" height="150" viewBox="0 0 145 150" fill="none" xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M96.2549 35.8121L71.7515 59.2086M117.949 57.8672C123.9 51.9837 127.193 44.1037 127.119 35.9243C127.044 27.745 123.608 19.9208 117.551 14.1369C111.493 8.35304 103.299 5.07226 94.7325 5.00118C86.1662 4.9301 77.9133 8.07443 71.7515 13.7569L31.6831 53.0292M19.355 65.1124C10.1636 73.8885 5 85.7916 5 98.2029C5 110.614 10.1636 122.517 19.355 131.293C28.5463 140.07 41.0125 145 54.011 145C62.8679 145 71.4776 142.711 78.9726 138.476M140 81.6348L93.7671 126.435M57.1411 73.159L42.4617 87.1753C40.9015 88.6142 39.657 90.3353 38.8009 92.2383C37.9448 94.1413 37.4941 96.188 37.4753 98.259C37.4564 100.33 37.8697 102.384 38.6911 104.301C39.5125 106.218 40.7254 107.959 42.2592 109.424C43.793 110.888 45.6169 112.047 47.6245 112.831C49.6321 113.615 51.7832 114.01 53.9522 113.992C56.1212 113.974 58.2648 113.543 60.2578 112.726C62.2508 111.909 64.0534 110.72 65.5603 109.23L104.493 71.0594" stroke="#E9EBDB" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <!-- Body -->
            <div style="padding: 28px">
              <h2 style="color: #222; margin: 0 0 8px; font-size: 1rem">
                Merci pour votre inscription.
              </h2>
              <p style="line-height: 1.5; margin: 0 0 18px">
                Il ne vous reste qu'une étape avant de pouvoir vous connecter et prendre des notes avec Yanotela.
              </p>
              <p style="line-height: 1.5; margin: 0 0 18px">
                Veuillez cliquer sur le bouton ci-dessous pour confirmer votre adresse e-mail et activer votre compte.
              </p>
              <p style="font-size: 12px;">
                Vous serez automatiquement redirigé.e sur Yanotela pour vous connecter.
              </p>

              <div style="text-align: center; padding: 20px 0;">
                <a
                  href="${validationUrl}"
                  style="
                    display: inline-block;
                    background: #882626;
                    color: #fff;
                    padding: 14px 20px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                  "
                >
                  Valider mon compte
                </a>
              </div>

              <p style="font-size: 12px;">
                Si ce bouton ne fonctionne pas, vous pouvez utiliser le lien suivant :
              </p>
              <p style="word-break: break-all; font-size: 12px;"><a href="${validationUrl}">${validationUrl}</a></p>

            </div>

            <!-- Footer -->
            <div
              style="
                background: #e9ebdb;
                padding: 14px 20px;
              "
            >
              <p>
                A bientôt sur Yanotela, l'application de prise de notes collaborative.
              </p>
              <p 
                style="
                  font-size: 12px;
                  color: #666;
                "
              >
                Cet e-mail vous a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
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
        <span
          style="
            display: none;
            font-size: 1px;
            color: #ffffff;
            line-height: 1px;
            max-height: 0;
            max-width: 0;
            opacity: 0;
            overflow: hidden;
          "
        >
          Réinitialisation de votre mot de passe
        </span>
        <div
          style="
            font-family: Arial, Helvetica, sans-serif;
            background: #f4f6f8;
            padding: 30px;
          "
        >
          <div
            style="
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 6px 12px rgba(34, 41, 47, 0.2);
            "
          >
            <!-- Header -->
            <div
              style="
                background: #882626;
                padding: 22px 24px;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 16px;
                position: relative;
              "
            >
              <h1 
                style="
                  margin: 0;
                  font-size: 24px;
                  font-weight: 700;
                  line-height: 1.2;
                  max-width: 80%;
                "
              >
                Réinitialisation de votre mot de passe
              </h1>
              <svg 
                style="
                  position:absolute;
                  right: 24px;
                  top: 22px;
                  height: 80px;
                  width: 80px;
                "
                width="145" height="150" viewBox="0 0 145 150" fill="none" xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M96.2549 35.8121L71.7515 59.2086M117.949 57.8672C123.9 51.9837 127.193 44.1037 127.119 35.9243C127.044 27.745 123.608 19.9208 117.551 14.1369C111.493 8.35304 103.299 5.07226 94.7325 5.00118C86.1662 4.9301 77.9133 8.07443 71.7515 13.7569L31.6831 53.0292M19.355 65.1124C10.1636 73.8885 5 85.7916 5 98.2029C5 110.614 10.1636 122.517 19.355 131.293C28.5463 140.07 41.0125 145 54.011 145C62.8679 145 71.4776 142.711 78.9726 138.476M140 81.6348L93.7671 126.435M57.1411 73.159L42.4617 87.1753C40.9015 88.6142 39.657 90.3353 38.8009 92.2383C37.9448 94.1413 37.4941 96.188 37.4753 98.259C37.4564 100.33 37.8697 102.384 38.6911 104.301C39.5125 106.218 40.7254 107.959 42.2592 109.424C43.793 110.888 45.6169 112.047 47.6245 112.831C49.6321 113.615 51.7832 114.01 53.9522 113.992C56.1212 113.974 58.2648 113.543 60.2578 112.726C62.2508 111.909 64.0534 110.72 65.5603 109.23L104.493 71.0594" stroke="#E9EBDB" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <!-- Body -->
            <div style="padding: 28px">
              <h2 style="color: #222; margin: 0 0 8px; font-size: 1rem">
                Vous avez demandé la réinitialisation de votre mot de passe.
              </h2>
              <p style="line-height: 1.5; margin: 0 0 18px">
                Pour continuer, veuillez cliquer sur le bouton ci-dessous.
              </p>
              <p style="font-size: 12px;">
                Pour votre sécurité, ce lien expirera dans 1 heure.
              </p>

              <div style="text-align: center; padding: 20px 0;">
                <a
                  href="${resetUrl}"
                  style="
                    display: inline-block;
                    background: #882626;
                    color: #fff;
                    padding: 14px 20px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                  "
                >
                  Réinitialiser mon mot de passe
                </a>
              </div>

              <p style="font-size: 12px;">
                Si ce bouton ne fonctionne pas, vous pouvez utiliser le lien suivant :
              </p>
              <p style="word-break: break-all; font-size: 12px;"><a href="${resetUrl}">${resetUrl}</a></p>

            </div>

            <!-- Footer -->
            <div
              style="
                background: #e9ebdb;
                padding: 14px 20px;
              "
            >
              <p>
                A bientôt sur Yanotela, l'application de prise de notes collaborative.
              </p>
              <p 
                style="
                  font-size: 12px;
                  color: #666;
                "
              >
                Cet e-mail vous a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
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
      <span
        style="
          display: none;
          font-size: 1px;
          color: #ffffff;
          line-height: 1px;
          max-height: 0;
          max-width: 0;
          opacity: 0;
          overflow: hidden;
        "
      >
        Confirmation de suppression de votre compte Yanotela
      </span>
      <div
        style="
          font-family: Arial, Helvetica, sans-serif;
          background: #f4f6f8;
          padding: 30px;
        "
      >
        <div
          style="
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 6px 12px rgba(34, 41, 47, 0.2);
          "
        >
          <!-- Header -->
          <div
            style="
              background: #882626;
              padding: 22px 24px;
              color: #fff;
              display: flex;
              align-items: center;
              gap: 16px;
              position: relative;
            "
          >
            <h1 
              style="
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                line-height: 1.2;
              "
            >
              Compte supprimé
            </h1>
            <svg 
              style="
                position:absolute;
                right: 24px;
                top: 22px;
                height: 80px;
                width: 80px;
              "
              width="145" height="150" viewBox="0 0 145 150" fill="none" xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M96.2549 35.8121L71.7515 59.2086M117.949 57.8672C123.9 51.9837 127.193 44.1037 127.119 35.9243C127.044 27.745 123.608 19.9208 117.551 14.1369C111.493 8.35304 103.299 5.07226 94.7325 5.00118C86.1662 4.9301 77.9133 8.07443 71.7515 13.7569L31.6831 53.0292M19.355 65.1124C10.1636 73.8885 5 85.7916 5 98.2029C5 110.614 10.1636 122.517 19.355 131.293C28.5463 140.07 41.0125 145 54.011 145C62.8679 145 71.4776 142.711 78.9726 138.476M140 81.6348L93.7671 126.435M57.1411 73.159L42.4617 87.1753C40.9015 88.6142 39.657 90.3353 38.8009 92.2383C37.9448 94.1413 37.4941 96.188 37.4753 98.259C37.4564 100.33 37.8697 102.384 38.6911 104.301C39.5125 106.218 40.7254 107.959 42.2592 109.424C43.793 110.888 45.6169 112.047 47.6245 112.831C49.6321 113.615 51.7832 114.01 53.9522 113.992C56.1212 113.974 58.2648 113.543 60.2578 112.726C62.2508 111.909 64.0534 110.72 65.5603 109.23L104.493 71.0594" stroke="#E9EBDB" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <!-- Body -->
          <div style="padding: 28px">
            <h2 style="color: #222; margin: 0 0 8px; font-size: 1rem">
              Votre compte a bien été supprimé.
            </h2>
            <p style="line-height: 1.5; margin: 0 0 18px">
              Nous sommes désolés de vous voir partir.
            </p>

            <div
              style="
                background: #f8fafb;
                border: 1px solid #eef2f4;
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 18px;
                font-size: 14px;
              "
            >
              <p style="margin: 0; color: #333; font-weight: 600">
                Ce que cela signifie
              </p>
              <ul style="margin: 8px 0 0 0; line-height: 1.45">
                <li>Les notes qui ont été partagées avec vous ne sont pas supprimées.</li>
                <li>
                  Vos notes, y compris celles que vous avez partagé, sont supprimées.
                </li>
                <li>
                  Si vous souhaitez réutiliser Yanotela à l'avenir, vous devrez créer un nouveau compte.
                </li>
              </ul>
            </div>

            <p style="margin: 0 0 18px; line-height: 1.5; font-size: 14px;">
              Si vous avez des questions ou que cette suppression n'était pas intentionnelle, <span style="font-weight: 600">contactez-nous rapidement</span>.
            </p>

            <div style="text-align: center; padding: 20px 0;">
              <a
                href="mailto:${process.env.SUPPORT_EMAIL || 'noreply.yanotela@gmail.com'}"
                style="
                  display: inline-block;
                  background: #882626;
                  color: #fff;
                  padding: 14px 20px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-weight: 600;
                  margin-right: 20px;
                "
              >
                Contacter le support
              </a>
              <a
                href="${FRONT_URL}"
                style="
                  display: inline-block;
                  background: #eef2f4;
                  color: #222;
                  padding: 14px 20px;
                  border-radius: 8px;
                  text-decoration: none;
                  font-weight: 600;
                "
              >
                Revenir sur Yanotela
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div
            style="
              background: #e9ebdb;
              padding: 14px 20px;
            "
          >
            <p>
              Merci d'avoir utilisé Yanotela. Nous espérons vous revoir bientôt.
            </p>
            <p 
              style="
                font-size: 12px;
                color: #666;
              "
            >
              Cet e-mail vous a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
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

async function sendNoteInvitationEmail(to, inviterName, noteTitle, noteId, role) {
  // Désactiver les emails pendant les tests
  if (process.env.NODE_ENV === 'test') {
    return { success: true, message: 'Email simulé en mode test' };
  }

  const noteUrl = `${FRONT_URL}/notes/${noteId}`;
  
  // Mapper le rôle à un texte lisible
  const roleNames = {
    1: 'Administrateur',
    2: 'Éditeur',
    3: 'Lecteur'
  };
  const roleName = roleNames[role] || 'Collaborateur';
  
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
      subject: `${inviterName} vous a invité à collaborer sur Yanotela`,
      html: `
        <span
          style="
            display: none;
            font-size: 1px;
            color: #ffffff;
            line-height: 1px;
            max-height: 0;
            max-width: 0;
            opacity: 0;
            overflow: hidden;
          "
        >
          Invitation à collaborer sur une note
        </span>
        <div
          style="
            font-family: Arial, Helvetica, sans-serif;
            background: #f4f6f8;
            padding: 30px;
          "
        >
          <div
            style="
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 6px 12px rgba(34, 41, 47, 0.2);
            "
          >
            <!-- Header -->
            <div
              style="
                background: #882626;
                padding: 22px 24px;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 16px;
                position: relative;
              "
            >
              <h1 
                style="
                  margin: 0;
                  font-size: 24px;
                  font-weight: 700;
                  line-height: 1.2;
                  max-width: 80%;
                "
              >
                Invitation à collaborer
              </h1>
              <svg 
                style="
                  position:absolute;
                  right: 24px;
                  top: 22px;
                  height: 80px;
                  width: 80px;
                "
                width="145" height="150" viewBox="0 0 145 150" fill="none" xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M96.2549 35.8121L71.7515 59.2086M117.949 57.8672C123.9 51.9837 127.193 44.1037 127.119 35.9243C127.044 27.745 123.608 19.9208 117.551 14.1369C111.493 8.35304 103.299 5.07226 94.7325 5.00118C86.1662 4.9301 77.9133 8.07443 71.7515 13.7569L31.6831 53.0292M19.355 65.1124C10.1636 73.8885 5 85.7916 5 98.2029C5 110.614 10.1636 122.517 19.355 131.293C28.5463 140.07 41.0125 145 54.011 145C62.8679 145 71.4776 142.711 78.9726 138.476M140 81.6348L93.7671 126.435M57.1411 73.159L42.4617 87.1753C40.9015 88.6142 39.657 90.3353 38.8009 92.2383C37.9448 94.1413 37.4941 96.188 37.4753 98.259C37.4564 100.33 37.8697 102.384 38.6911 104.301C39.5125 106.218 40.7254 107.959 42.2592 109.424C43.793 110.888 45.6169 112.047 47.6245 112.831C49.6321 113.615 51.7832 114.01 53.9522 113.992C56.1212 113.974 58.2648 113.543 60.2578 112.726C62.2508 111.909 64.0534 110.72 65.5603 109.23L104.493 71.0594" stroke="#E9EBDB" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <!-- Body -->
            <div style="padding: 28px">
              <h2 style="color: #222; margin: 0 0 8px; font-size: 1rem">
                ${inviterName} vous invite à collaborer
              </h2>
              <p style="line-height: 1.5; margin: 0 0 18px">
                Vous avez été invité.e à collaborer sur la note <strong>"${noteTitle}"</strong>.
              </p>
              
              <div
                style="
                  background: #f8fafb;
                  border: 1px solid #eef2f4;
                  padding: 16px;
                  border-radius: 8px;
                  margin-bottom: 18px;
                  font-size: 14px;
                "
              >
                <p style="margin: 0; color: #333; font-weight: 600">
                  Vous êtes ${roleName}.
                </p>
                <p style="margin: 8px 0 0 0; line-height: 1.45; color: #555;">
                  ${role === 1 ? 'Vous pouvez modifier la note et gérer les permissions des autres collaborateurs.' :
                    role === 2 ? 'Vous pouvez modifier le contenu de la note.' :
                    'Vous pouvez consulter la note en lecture seule.'}
                </p>
              </div>

              <p style="line-height: 1.5; margin: 0 0 18px">
                Cliquez sur le bouton ci-dessous pour accéder à la note et commencer à collaborer.
              </p>
              <p style="font-size: 12px;">
                Il est possible que vous ayiez à vous connecter.
              </p>

              <div style="text-align: center; padding: 20px 0;">
                <a
                  href="${noteUrl}"
                  style="
                    display: inline-block;
                    background: #882626;
                    color: #fff;
                    padding: 14px 20px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                  "
                >
                  Ouvrir la note
                </a>
              </div>

              <p style="font-size: 12px;">
                Si ce bouton ne fonctionne pas, vous pouvez utiliser le lien suivant :
              </p>
              <p style="word-break: break-all; font-size: 12px;"><a href="${noteUrl}">${noteUrl}</a></p>

            </div>

            <!-- Footer -->
            <div
              style="
                background: #e9ebdb;
                padding: 14px 20px;
              "
            >
              <p>
                A bientôt sur Yanotela, l'application de prise de notes collaborative.
              </p>
              <p 
                style="
                  font-size: 12px;
                  color: #666;
                "
              >
                Cet e-mail vous a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        </div>
      `
    });
    
    return { success: true, message: 'Email d\'invitation envoyé avec succès' };
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email d\'invitation:', error);
    throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
  }
}

async function a2fEmail(to, validationCode) {
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
      subject: 'Code de vérification à deux facteurs',
      html: `
        <span
          style="
            display: none;
            font-size: 1px;
            color: #ffffff;
            line-height: 1px;
            max-height: 0;
            max-width: 0;
            opacity: 0;
            overflow: hidden;
          "
        >
          Vérification de votre identité
        </span>
        <div
          style="
            font-family: Arial, Helvetica, sans-serif;
            background: #f4f6f8;
            padding: 30px;
          "
        >
          <div
            style="
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 6px 12px rgba(34, 41, 47, 0.2);
            "
          >
            <!-- Header -->
            <div
              style="
                background: #882626;
                padding: 22px 24px;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 16px;
                position: relative;
              "
            >
              <h1 
                style="
                  margin: 0;
                  font-size: 24px;
                  font-weight: 700;
                  line-height: 1.2;
                  max-width: 80%;
                "
              >
                Vérification de votre identité
              </h1>
              <svg 
                style="
                  position:absolute;
                  right: 24px;
                  top: 22px;
                  height: 80px;
                  width: 80px;
                  z-index: 10;
                "
                width="145" height="150" viewBox="0 0 145 150" fill="none" xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M96.2549 35.8121L71.7515 59.2086M117.949 57.8672C123.9 51.9837 127.193 44.1037 127.119 35.9243C127.044 27.745 123.608 19.9208 117.551 14.1369C111.493 8.35304 103.299 5.07226 94.7325 5.00118C86.1662 4.9301 77.9133 8.07443 71.7515 13.7569L31.6831 53.0292M19.355 65.1124C10.1636 73.8885 5 85.7916 5 98.2029C5 110.614 10.1636 122.517 19.355 131.293C28.5463 140.07 41.0125 145 54.011 145C62.8679 145 71.4776 142.711 78.9726 138.476M140 81.6348L93.7671 126.435M57.1411 73.159L42.4617 87.1753C40.9015 88.6142 39.657 90.3353 38.8009 92.2383C37.9448 94.1413 37.4941 96.188 37.4753 98.259C37.4564 100.33 37.8697 102.384 38.6911 104.301C39.5125 106.218 40.7254 107.959 42.2592 109.424C43.793 110.888 45.6169 112.047 47.6245 112.831C49.6321 113.615 51.7832 114.01 53.9522 113.992C56.1212 113.974 58.2648 113.543 60.2578 112.726C62.2508 111.909 64.0534 110.72 65.5603 109.23L104.493 71.0594" stroke="#E9EBDB" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <!-- Body -->
            <div style="padding: 28px">
              <h2 style="color: #222; margin: 0 0 8px; font-size: 1rem">
                Vous avez demandé à consulter les données associées à votre compte.
              </h2>
              <p style="line-height: 1.5">
                Pour votre sécurité, nous devons vérifier que vous êtes bien le propriétaire de cette adresse e-mail.
              </p>
              <p style="line-height: 1.5">
                Veuillez renseigner le code ci-dessous pour valider votre identité :
              </p>

              <div style="text-align: center; padding: 20px 0;">
                <span
                  style="
                    font-size: 24px;
                    font-weight: bold;
                    padding: 12px 20px;
                    border: 2px dashed #882626;
                    border-radius: 8px;
                    letter-spacing: 4px;
                    color: #882626;
                    display: inline-block;
                  "
                >
                  ${validationCode}
                </span>
              </div>

              <p style="font-size: 12px;">
                Ce code est valide pendant 15 minutes.
              </p>
              <p style="font-size: 12px; color: #882626">
                Si vous pensez que quelqu'un utilise votre compte Yanotela sans votre autorisation, veuillez réinitialiser votre mot de passe dès que possible.
              </p>

            </div>

            <!-- Footer -->
            <div
              style="
                background: #e9ebdb;
                padding: 14px 20px;
              "
            >
              <p>
                A bientôt sur Yanotela, l'application de prise de notes collaborative.
              </p>
              <p 
                style="
                  font-size: 12px;
                  color: #666;
                "
              >
                Cet e-mail vous a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        </div>
      `
    });
    
    return { success: true, message: 'Email de code 2FA envoyé avec succès' };
    
  }
  catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de code 2FA:', error);
    throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
  }
}

async function userDataEmail(to, userData) {
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
      subject: 'Vos données Yanotela',
      html: `
        <span style="
          display: none;
          font-size: 1px;
          color: #ffffff;
          line-height: 1px;
          max-height: 0;
          max-width: 0;
          opacity: 0;
          overflow: hidden;
        ">
          Vos données personnelles Yanotela
        </span>
        <div style="
          font-family: Arial, Helvetica, sans-serif;
          background: #f4f6f8;
          padding: 30px;
        ">
          <div style="
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 6px 12px rgba(34, 41, 47, 0.2);
          ">
            <!-- Header -->
            <div style="
              background: #882626;
              padding: 22px 24px;
              color: #fff;
              display: flex;
              align-items: center;
              gap: 16px;
              position: relative;
            ">
              <h1 style="
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                line-height: 1.2;
                max-width: 80%;
              ">
                Vos données Yanotela
              </h1>
              <svg 
                style="
                  position:absolute;
                  right: 24px;
                  top: 22px;
                  height: 80px;
                  width: 80px;
                  z-index: 10;
                "
                width="145" height="150" viewBox="0 0 145 150" fill="none" xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M96.2549 35.8121L71.7515 59.2086M117.949 57.8672C123.9 51.9837 127.193 44.1037 127.119 35.9243C127.044 27.745 123.608 19.9208 117.551 14.1369C111.493 8.35304 103.299 5.07226 94.7325 5.00118C86.1662 4.9301 77.9133 8.07443 71.7515 13.7569L31.6831 53.0292M19.355 65.1124C10.1636 73.8885 5 85.7916 5 98.2029C5 110.614 10.1636 122.517 19.355 131.293C28.5463 140.07 41.0125 145 54.011 145C62.8679 145 71.4776 142.711 78.9726 138.476M140 81.6348L93.7671 126.435M57.1411 73.159L42.4617 87.1753C40.9015 88.6142 39.657 90.3353 38.8009 92.2383C37.9448 94.1413 37.4941 96.188 37.4753 98.259C37.4564 100.33 37.8697 102.384 38.6911 104.301C39.5125 106.218 40.7254 107.959 42.2592 109.424C43.793 110.888 45.6169 112.047 47.6245 112.831C49.6321 113.615 51.7832 114.01 53.9522 113.992C56.1212 113.974 58.2648 113.543 60.2578 112.726C62.2508 111.909 64.0534 110.72 65.5603 109.23L104.493 71.0594" stroke="#E9EBDB" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <!-- Body -->
            <div style="padding: 28px">
              <h2 style="color: #222; margin: 0 0 8px; font-size: 1rem">
                Vous avez demandé à consulter vos données personnelles. 
              </h2>
              <p style="line-height: 1.5; margin: 0 0 18px">
                Les voici ci-dessous :
              </p>
              <div style="
                background: #f8fafb;
                border: 1px solid #eef2f4;
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 18px;
                font-size: 14px;
              ">
                <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                  ${Object.entries(userData).map(([key, value]) => `
                  <li style="margin-bottom: 12px;">
                    <strong style="color: #333;">${key}:</strong>
                    ${Array.isArray(value)
                    ? `
                    <pre style="
                      background: #fff;
                      border: 1px solid #e0e0e0;
                      padding: 12px;
                      border-radius: 4px;
                      overflow-x: auto;
                      margin: 8px 0 0 0;
                      font-size: 12px;
                      line-height: 1.4;
                    ">${JSON.stringify(value, null, 2)}</pre>`
                    : `<span style="color: #555;">${value}</span>`
                    }
                  </li>
                  `).join('')}
                </ul>
              </div>
              <p style="font-size: 12px; color: #222;>
                Pour la sécurité de vos données, l'équipe Yanotela n'a pas accès au contenu de vos notes, ni à votre mot de passe.
              </p>
              <p style="font-size: 12px; color: #882626">
                Si vous n'êtes pas à l'origine de cette demande, veuillez réinitialiser les mots de passe de votre compte
                Yanotela et de votre adresse e-mail immédiatement.
              </p>
            </div>
            <!-- Footer -->
            <div style="
              background: #e9ebdb;
              padding: 14px 20px;
            ">
              <p>
                A bientôt sur Yanotela, l'application de prise de notes collaborative.
              </p>
              <p style="
                font-size: 12px;
                color: #666;
              ">
                Cet e-mail vous a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        </div>
      `
        });
    
    return { success: true, message: 'Email des données utilisateur envoyé avec succès' };
    
  }catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email des données utilisateur:', error);
      throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
    }
}

export { sendValidationEmail, sendResetPasswordEmail, sendDeleteAccountEmail, sendNoteInvitationEmail, a2fEmail, userDataEmail };

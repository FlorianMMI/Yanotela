import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Configuration OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
);

// Scopes nécessaires pour obtenir les informations de profil
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

/**
 * Initie l'authentification Google
 */
export const initiateGoogleAuth = (req, res) => {
  try {
    // Générer un état pour la sécurité CSRF
    const state = crypto.randomBytes(32).toString('hex');
    req.session.oauthState = state;

    // Générer l'URL d'autorisation Google
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: state,
      prompt: 'consent' // Force l'affichage du consentement pour obtenir refresh_token
    });

    console.log('Redirection vers Google OAuth:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Erreur lors de l\'initiation Google Auth:', error);
    res.status(500).render('index', { 
      error: 'Erreur lors de la connexion avec Google' 
    });
  }
};

/**
 * Gère le callback Google OAuth
 */
export const handleGoogleCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Vérifier s'il y a une erreur OAuth
    if (error) {
      console.error('Erreur OAuth Google:', error);
      return res.status(400).render('index', { 
        error: 'Connexion Google annulée ou échouée' 
      });
    }

    // Vérifier l'état CSRF
    if (!state || state !== req.session.oauthState) {
      console.error('État CSRF invalide');
      return res.status(400).render('index', { 
        error: 'Erreur de sécurité lors de la connexion' 
      });
    }

    // Échanger le code contre les tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Obtenir les informations utilisateur
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    console.log('Informations utilisateur Google:', userInfo);

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email }
    });

    if (user) {
      // Utilisateur existant - connexion
      console.log('Utilisateur existant trouvé:', user.pseudo);
      
      // Mettre à jour les informations si nécessaire
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          is_verified: true, // Les comptes Google sont automatiquement vérifiés
          // Optionnel: mettre à jour le nom/prénom s'ils ont changé
          prenom: userInfo.given_name || user.prenom,
          nom: userInfo.family_name || user.nom
        }
      });

      // Créer la session
      req.session.userId = user.id;
      req.session.pseudo = user.pseudo;
      await req.session.save();

      console.log('Connexion Google réussie pour:', user.pseudo);
      // Redirection vers le client après authentification
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.redirect(`${clientUrl}/notes`);
    } else {
      // Nouvel utilisateur - inscription
      console.log('Création d\'un nouveau compte pour:', userInfo.email);
      
      // Générer un pseudo unique basé sur le nom ou l'email
      let basePseudo = userInfo.given_name?.toLowerCase() || 
                      userInfo.email.split('@')[0];
      
      // S'assurer que le pseudo est alphanumérique
      basePseudo = basePseudo.replace(/[^a-zA-Z0-9]/g, '');
      
      // Vérifier l'unicité du pseudo et ajouter un suffixe si nécessaire
      let pseudo = basePseudo;
      let counter = 1;
      
      while (await prisma.user.findUnique({ where: { pseudo } })) {
        pseudo = `${basePseudo}${counter}`;
        counter++;
      }

      // Créer le nouvel utilisateur
      const token = crypto.randomBytes(32).toString('hex');
      
      user = await prisma.user.create({
        data: {
          pseudo: pseudo,
          email: userInfo.email,
          prenom: userInfo.given_name || '',
          nom: userInfo.family_name || '',
          password: crypto.randomBytes(32).toString('hex'), // Mot de passe aléatoire (non utilisé)
          token: token,
          is_verified: true // Les comptes Google sont automatiquement vérifiés
        }
      });

      // Créer la session
      req.session.userId = user.id;
      req.session.pseudo = user.pseudo;
      await req.session.save();

      console.log('Inscription Google réussie pour:', user.pseudo);
      // Redirection vers le client après authentification
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return res.redirect(`${clientUrl}/notes`);
    }
  } catch (error) {
    console.error('Erreur lors du callback Google:', error);
    res.status(500).render('index', { 
      error: 'Erreur lors de la connexion avec Google' 
    });
  } finally {
    // Nettoyer l'état de la session
    delete req.session.oauthState;
  }
};

/**
 * Déconnexion Google (logout)
 */
export const googleLogout = async (req, res) => {
  try {
    // Détruire la session locale
    req.session.destroy((err) => {
      if (err) {
        console.error('Erreur lors de la destruction de session:', err);
        return res.status(500).render('index', { 
          error: 'Erreur lors de la déconnexion' 
        });
      }
      
      console.log('Déconnexion Google réussie');
      
      // Rediriger vers la page de déconnexion Google (optionnel)
      // ou simplement vers la page d'accueil
      res.redirect('/');
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion Google:', error);
    res.status(500).render('index', { 
      error: 'Erreur lors de la déconnexion' 
    });
  }
};

/**
 * Lier un compte Google à un compte existant
 */
export const linkGoogleAccount = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est connecté
    if (!req.session.userId) {
      return res.status(401).render('index', { 
        error: 'Vous devez être connecté pour lier votre compte Google' 
      });
    }

    // Initier le processus OAuth avec un paramètre spécial
    req.session.linkingAccount = true;
    
    const state = crypto.randomBytes(32).toString('hex');
    req.session.oauthState = state;

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: state,
      prompt: 'consent'
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error('Erreur lors de la liaison du compte Google:', error);
    res.status(500).render('index', { 
      error: 'Erreur lors de la liaison avec Google' 
    });
  }
};
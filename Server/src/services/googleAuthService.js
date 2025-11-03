import { google } from 'googleapis';

/**
 * Service pour gérer la configuration Google OAuth2
 */
class GoogleAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback'
    );

    this.scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];
  }

  /**
   * Génère une URL d'autorisation Google
   */
  generateAuthUrl(state, prompt = 'consent') {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      state: state,
      prompt: prompt
    });
  }

  /**
   * Échange un code d'autorisation contre des tokens
   */
  async getTokens(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  /**
   * Obtient les informations utilisateur depuis l'API Google
   */
  async getUserInfo(tokens) {
    this.oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return data;
  }

  /**
   * Révoque les tokens d'accès
   */
  async revokeTokens(accessToken) {
    try {
      await this.oauth2Client.revokeToken(accessToken);
      return true;
    } catch (error) {
      console.error('Erreur lors de la révocation des tokens:', error);
      return false;
    }
  }

  /**
   * Valide la configuration Google OAuth
   */
  validateConfig() {
    const errors = [];
    
    if (!process.env.GOOGLE_CLIENT_ID) {
      errors.push('GOOGLE_CLIENT_ID manquant dans les variables d\'environnement');
    }
    
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      errors.push('GOOGLE_CLIENT_SECRET manquant dans les variables d\'environnement');
    }
    
    if (!process.env.GOOGLE_REDIRECT_URI) {
      console.warn('GOOGLE_REDIRECT_URI non défini, utilisation de l\'URL par défaut');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration Google OAuth invalide: ${errors.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Génère un pseudo unique basé sur les informations Google
   */
  generatePseudo(userInfo, existingPseudos = []) {
    let basePseudo = userInfo.given_name?.toLowerCase() || 
                    userInfo.email.split('@')[0];
    
    // S'assurer que le pseudo est alphanumérique
    basePseudo = basePseudo.replace(/[^a-zA-Z0-9]/g, '');
    
    // S'assurer qu'il fait au moins 3 caractères
    if (basePseudo.length < 3) {
      basePseudo = `user${Math.floor(Math.random() * 1000)}`;
    }
    
    // Vérifier l'unicité
    let pseudo = basePseudo;
    let counter = 1;
    
    while (existingPseudos.includes(pseudo)) {
      pseudo = `${basePseudo}${counter}`;
      counter++;
    }
    
    return pseudo;
  }

  /**
   * Formate les données utilisateur Google pour la base de données
   */
  formatUserData(userInfo, pseudo) {
    return {
      pseudo: pseudo,
      email: userInfo.email,
      prenom: userInfo.given_name || '',
      nom: userInfo.family_name || '',
      is_verified: true // Les comptes Google sont automatiquement vérifiés
    };
  }
}

// Instance singleton
const googleAuthService = new GoogleAuthService();

export default googleAuthService;
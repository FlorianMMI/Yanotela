import bcrypt from "bcrypt";
import { PrismaClient } from '@prisma/client';
import { sendValidationEmail, sendResetPasswordEmail } from "../services/emailService.js";

const prisma = new PrismaClient();
import crypto from "crypto";
import { body, validationResult } from "express-validator";

const validateRegistration = [
  body("pseudo")
    .isLength({ min: 3 })
    .withMessage("Le pseudo doit avoir au moins 3 caractères")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage(
      "Le pseudo ne doit contenir que des caractères alphanumériques"
    ),
  body("email").isEmail().withMessage("Email invalide"),
  body("password")
    .isLength({ min: 3 })
    .withMessage("Le mot de passe doit avoir au moins 3 caractères")
    .matches(/[0-9]/)
    .withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Le mot de passe doit contenir au moins un caractère spécial')
];

const register = async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      message: "Erreurs de validation"
    });
  }

  const { firstName, lastName, pseudo, email, password } = req.body;

  try {
    let existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        error: "Cet email est déjà utilisé."
      });
    }
    
    existing = await prisma.user.findUnique({ where: { pseudo } });
    if (existing) {
      return res.status(409).json({
        error: "Ce pseudo est déjà utilisé."
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    
    try {
      await sendValidationEmail(email, token);
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      // On continue quand même pour créer l'utilisateur
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        pseudo,
        email,
        password: hashedPassword,
        prenom: firstName,
        nom: lastName,
        is_verified: false,
        token,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Compte créé avec succès. Veuillez cliquer sur le lien envoyé par mail.",
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Erreur création compte:", err);
    return res.status(500).json({
      error: "Erreur serveur. Réessayez plus tard."
    });
  }
};

const login = async (req, res) => {
  const { identifiant, password } = req.body;
  
  // Vérifier que les données sont présentes
  if (!identifiant || !password) {
    return res.status(400).json({
      error: "Identifiant et mot de passe requis"
    });
  }

  try {
    const userByPseudo = await prisma.user.findUnique({
      where: { pseudo: identifiant },
    });
    const userByEmail = await prisma.user.findUnique({
      where: { email: identifiant },
    });
    const user = userByPseudo || userByEmail;
    const ok = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !ok) {
      return res.status(401).json({
        error: "Utilisateur ou mot de passe incorrect"
      });
    }

    if (!user.is_verified) {
      try {
        // Générer un nouveau token de validation si nécessaire
        let validationToken = user.token;
        if (!validationToken || validationToken.startsWith("VALIDATED_")) {
          validationToken = crypto.randomBytes(32).toString("hex");
          await prisma.user.update({
            where: { id: user.id },
            data: { token: validationToken }
          });
        }
        
        // Envoyer l'email de validation
        await sendValidationEmail(user.email, validationToken);
        
        return res.status(401).json({
          error: "Compte non activé. Un nouvel email de validation vient d'être envoyé à votre adresse email."
        });
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email de validation:", emailError);
        return res.status(401).json({
          error: "Compte non activé. Veuillez vérifier votre email ou contacter le support."
        });
      }
    }

    if (user.deleted_at) {
      
      const deletionDate = new Date(user.deleted_at);
      const expirationDate = new Date(deletionDate.getTime() + (1 * 60 * 1000));
      const now = new Date();
      
      if (now > expirationDate) {
        return res.status(410).json({
          error: "Votre compte a expiré et sera supprimé définitivement. Vous ne pouvez plus vous connecter.",
          accountExpired: true
        });
      } else {
        // Le compte est en attente de suppression, calculer le temps restant
        const timeRemaining = expirationDate - now;
        const secondsRemaining = Math.ceil(timeRemaining / 1000);
        
        return res.status(403).json({
          error: `Votre compte sera supprimé dans ${secondsRemaining} seconde${secondsRemaining > 1 ? 's' : ''}. Contactez le support pour annuler.`,
          accountScheduledForDeletion: true,
          deletedAt: user.deleted_at,
          secondsRemaining: secondsRemaining
        });
      }
    }

    req.session.userId = user.id;
    req.session.pseudo = user.pseudo;
    await req.session.save();
    
    return res.json({
      success: true,
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Erreur connexion", err);
    return res.status(500).json({
      error: "Erreur serveur",
      details: err.message
    });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur destruction session:", err);
      return res.status(500).json({
        error: "Erreur lors de la déconnexion"
      });
    }
    res.clearCookie("connect.sid");
    
    return res.json({
      success: true,
      message: "Déconnexion réussie"
    });
  });
};

const validate = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await prisma.user.findFirst({ where: { token } });
    if (!user || user.token.startsWith("VALIDATED_")) {
      return res.status(400).json({
        error: "Lien invalide, expiré ou déjà utilisé."
      });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        token: "VALIDATED_" + user.token,
      },
    });
    req.session.userId = user.id;
    req.session.pseudo = user.pseudo;
    await req.session.save();
    
    return res.json({
      success: true,
      message: "Compte validé avec succès",
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Erreur validation:", err);
    return res.status(500).json({
      error: "Erreur serveur"
    });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      error: "Email requis"
    });
  }
  
  try {
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({
        success: true,
        message: "Si votre adresse email est valide, vous recevrez un email de réinitialisation."
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Sauvegarder le token dans la base de données (on réutilise le champ token)
    await prisma.user.update({
      where: { email },
      data: { token: "RESET_" + resetToken }
    });

    // Envoyer l'email
    await sendResetPasswordEmail(email, resetToken);
    return res.json({
      success: true,
      message: "Si votre adresse email est valide, vous recevrez un email de réinitialisation"
    });
  } catch (err) {
    console.error("Erreur forgot password:", err);
    return res.status(500).json({
      error: "Erreur serveur. Réessayez plus tard."
    });
  }
};

const resetPasswordGet = async (req, res) => {
  const { token } = req.params;
  
  try {
    // Vérifier que le token existe et est valide
    const user = await prisma.user.findFirst({ 
      where: { token: "RESET_" + token } 
    });
    
    if (!user) {
      return res.status(400).json({
        error: "Lien de réinitialisation invalide ou expiré."
      });
    }
    
    return res.json({
      success: true,
      message: "Token valide",
      token: token
    });
  } catch (err) {
    console.error("Erreur reset password get:", err);
    return res.status(500).json({
      error: "Erreur serveur"
    });
  }
};

const resetPasswordPost = async (req, res) => {
  const { password, token } = req.body;
  
  try {
    // Vérifications
    if (!password || !token) {
      return res.status(400).json({
        error: "Token et nouveau mot de passe requis"
      });
    }
    
    if (password.length < 3) {
      return res.status(400).json({
        error: "Le mot de passe doit avoir au moins 3 caractères"
      });
    }
    
    // Trouver l'utilisateur avec le token
    const user = await prisma.user.findFirst({ 
      where: { token: "RESET_" + token } 
    });
    
    if (!user) {
      return res.status(400).json({
        error: "Lien de réinitialisation invalide ou expiré."
      });
    }
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Mettre à jour le mot de passe et supprimer le token
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        token: "USED_RESET_" + token // Marquer le token comme utilisé
      }
    });

    return res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès"
    });
  } catch (err) {
    console.error("Erreur reset password post:", err);
    return res.status(500).json({
      error: "Erreur serveur"
    });
  }
};

const checkAuth = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        authenticated: false
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        pseudo: true,
        email: true
      }
    });

    if (!user) {
      return res.status(401).json({
        authenticated: false
      });
    }

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Erreur vérification authentification:", err);
    return res.status(500).json({
      authenticated: false
    });
  }
};

export { register, login, logout, validate, validateRegistration, forgotPassword, resetPasswordGet, resetPasswordPost, checkAuth };

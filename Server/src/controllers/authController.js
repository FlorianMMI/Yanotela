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
    console.log("Erreurs de validation:", errors.array());
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
    console.log("Envoi de l'email de validation...");
    
    try {
      await sendValidationEmail(email, token);
      console.log("Email de validation envoyé avec succès");
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

    console.log("Utilisateur créé:", user.pseudo);
    
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
    
    if (!user) {
      console.log("Utilisateur non trouvé pour", identifiant);
      return res.status(401).json({
        error: "Utilisateur non trouvé"
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log("Mot de passe incorrect pour", identifiant);
      return res.status(401).json({
        error: "Mot de passe incorrect"
      });
    }

    if (!user.is_verified) {
      console.log("Compte non activé pour", user.pseudo);
      return res.status(401).json({
        error: "Compte non activé"
      });
    }

    req.session.userId = user.id;
    req.session.pseudo = user.pseudo;
    await req.session.save();
    console.log("Session après login:", req.session);
    
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
      error: "Erreur serveur"
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
  console.log("Tentative de validation avec token:", token);
  try {
    const user = await prisma.user.findFirst({ where: { token } });
    console.log("Utilisateur trouvé:", user);
    if (!user || user.token.startsWith("VALIDATED_")) {
      console.log(
        "Lien de validation invalide ou déjà utilisé pour token:",
        token
      );
      return res.status(400).json({
        error: "Lien invalide, expiré ou déjà utilisé."
      });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        token: "VALIDATED_" + user.token, // Marquer le token comme utilisé
      },
    });
    req.session.userId = user.id;
    req.session.pseudo = user.pseudo;
    await req.session.save();
    console.log("Session après validation:", req.session);
    
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
      return res.status(404).json({
        error: "Aucun compte associé à cet email"
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
      message: "Un lien de réinitialisation a été envoyé à votre adresse email."
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
    
    console.log("Mot de passe réinitialisé pour:", user.pseudo);
    
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

import bcrypt from "bcrypt";
import { prisma } from "../app.js";
import { sendValidationEmail, sendResetPasswordEmail } from "../services/emailService.js";
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
    .withMessage("Le mot de passe doit avoir au moins 3 caractères"),
  // .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre')
  // .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Le mot de passe doit contenir au moins un caractère spécial')
];

const register = async (req, res) => {
  const errors = validationResult(req);
  
  // Détection basée sur l'URL de la route
  const isApiRequest = req.route?.path?.startsWith('/api/') || 
                      req.headers['content-type']?.includes('application/json') || 
                      req.headers.accept?.includes('application/json') ||
                      req.get('Accept')?.includes('application/json');
  
  console.log("Type de requête détecté:", {
    path: req.route?.path,
    contentType: req.headers['content-type'],
    accept: req.headers.accept,
    isApiRequest: isApiRequest
  });
  
  if (!errors.isEmpty()) {
    console.log("Erreurs de validation:", errors.array());
    if (isApiRequest) {
      return res.status(400).json({
        errors: errors.array(),
        message: "Erreurs de validation"
      });
    }
    return res.render("register", {
      errors: errors.array(),
      pseudo: req.body.pseudo || "",
      email: req.body.email || "",
    });
  }

  const { firstName, lastName, pseudo, email, password } = req.body;

  try {
    let existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (isApiRequest) {
        return res.status(409).json({
          error: "Cet email est déjà utilisé."
        });
      }
      return res.render("register", {
        error: "Cet email est déjà utilisé.",
      });
    }
    
    existing = await prisma.user.findUnique({ where: { pseudo } });
    if (existing) {
      if (isApiRequest) {
        return res.status(409).json({
          error: "Ce pseudo est déjà utilisé."
        });
      }
      return res.render("register", {
        error: "Ce pseudo est déjà utilisé.",
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
    
    if (isApiRequest) {
      console.log("Envoi de la réponse JSON...");
      return res.status(201).json({
        success: true,
        message: "Compte créé avec succès. Veuillez cliquer sur le lien envoyé par mail.",
        user: {
          id: user.id,
          pseudo: user.pseudo,
          email: user.email
        }
      });
    }
    
    res.render("register", {
      success:
        "Compte créé avec succès. Veuillez cliquer sur le lien envoyé par mail.",
    });
  } catch (err) {
    console.error("Erreur création compte:", err);
    if (isApiRequest) {
      return res.status(500).json({
        error: "Erreur serveur. Réessayez plus tard."
      });
    }
    res.render("register", { error: "Erreur serveur. Réessayez plus tard." });
  }
};

const login = async (req, res) => {
  const { identifiant, password } = req.body;
  
  // Déterminer si c'est une requête API (JSON) ou une requête web (Twig)
  const isApiRequest = req.route?.path?.startsWith('/api/') || 
                      req.headers['content-type']?.includes('application/json');
  
  // Vérifier que les données sont présentes
  if (!identifiant || !password) {
    if (isApiRequest) {
      return res.status(400).json({
        error: "Identifiant et mot de passe requis"
      });
    }
    return res.render("index", {
      error: "Identifiant et mot de passe requis",
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
      if (isApiRequest) {
        return res.status(401).json({
          error: "Utilisateur non trouvé"
        });
      }
      return res.render("index", {
        error: "Utilisateur non trouvé",
        identifiant,
      });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log("Mot de passe incorrect pour", identifiant);
      if (isApiRequest) {
        return res.status(401).json({
          error: "Mot de passe incorrect"
        });
      }
      return res.render("index", {
        error: "Mot de passe incorrect",
        identifiant,
      });
    }

    if (!user.is_verified) {
      console.log("Compte non activé pour", user.pseudo);
      if (isApiRequest) {
        return res.status(401).json({
          error: "Compte non activé"
        });
      }
      return res.render("index", { error: "Compte non activé", pseudo: user.pseudo });
    }

    req.session.userId = user.id;
    req.session.pseudo = user.pseudo;
    await req.session.save();
    console.log("Session après login:", req.session);
    
    if (isApiRequest) {
      return res.json({
        success: true,
        user: {
          id: user.id,
          pseudo: user.pseudo,
          email: user.email
        }
      });
    }
    return res.redirect("/");
  } catch (err) {
    console.error("Erreur connexion", err);
    if (isApiRequest) {
      return res.status(500).json({
        error: "Erreur serveur"
      });
    }
    res.status(500).send("Erreur serveur");
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur destruction session:", err);
      return res.status(500).send("Erreur lors de la déconnexion");
    }
    res.clearCookie("connect.sid");
    return res.redirect("/");
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
      return res.status(400).send("Lien invalide, expiré ou déjà utilisé.");
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
    console.log("Session après login:", req.session);
    return res.redirect("/");
  } catch (err) {
    console.error("Erreur validation:", err);
    res.status(500).send("Erreur serveur");
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.render("forgotPassword", { error: "Email requis" });
  }
  
  try {
    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.render("forgotPassword", { error: "Aucun compte associé à cet email" });
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
    res.render("forgotPassword", {
      success: "Un lien de réinitialisation a été envoyé à votre adresse email.",
    });
  } catch (err) {
    console.error("Erreur forgot password:", err);
    res.render("forgotPassword", { error: "Erreur serveur. Réessayez plus tard." });
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
      return res.status(400).send("Lien de réinitialisation invalide ou expiré.");
    }
    
    // Afficher le formulaire de nouveau mot de passe
    res.render("newPassword", { token });
  } catch (err) {
    console.error("Erreur reset password get:", err);
    res.status(500).send("Erreur serveur");
  }
};

const resetPasswordPost = async (req, res) => {
  const { password, confirm_password, token } = req.body;
  
  try {
    // Vérifications
    if (!password || !confirm_password) {
      return res.render("newPassword", { 
        error: "Tous les champs sont requis",
        token 
      });
    }
    
    if (password !== confirm_password) {
      return res.render("newPassword", { 
        error: "Les mots de passe ne correspondent pas",
        token 
      });
    }
    
    if (password.length < 3) {
      return res.render("newPassword", { 
        error: "Le mot de passe doit avoir au moins 3 caractères",
        token 
      });
    }
    
    // Trouver l'utilisateur avec le token
    const user = await prisma.user.findFirst({ 
      where: { token: "RESET_" + token } 
    });
    
    if (!user) {
      return res.status(400).send("Lien de réinitialisation invalide ou expiré.");
    }
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Mettre à jour le mot de passe et supprimer le token
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        token: "USED_" + Date.now() // Marquer le token comme utilisé
      }
    });
    
    console.log("Mot de passe réinitialisé pour:", user.pseudo);
    
    // Connecter automatiquement l'utilisateur
    req.session.userId = user.id;
    req.session.pseudo = user.pseudo;
    await req.session.save();
    
    return res.redirect("/");
  } catch (err) {
    console.error("Erreur reset password post:", err);
    res.render("newPassword", { 
      error: "Erreur serveur. Réessayez plus tard.",
      token 
    });
  }
};


export { register, login, logout, validate, validateRegistration, forgotPassword, resetPasswordGet, resetPasswordPost };

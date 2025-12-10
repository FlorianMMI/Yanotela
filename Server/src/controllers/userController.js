/**
 * Contrôleur pour la gestion des utilisateurs.
 *
 * Ce fichier fournit la fonction pour récupérer les informations
 * de l'utilisateur connecté depuis la base de données.
 *
 * Utilise Prisma comme ORM pour interagir avec la base de données.
 *
 * Fonction exportée :
 * - getUserInfo : Récupère les informations de l'utilisateur authentifié.
 */

import { PrismaClient } from "@prisma/client";
import { sendDeleteAccountEmail } from "../services/emailService.js";
import { createClient } from "redis";
import { a2fEmail, userDataEmail } from "../services/emailService.js";

const prisma = new PrismaClient();

export const userController = {
  // Récupérer les informations de l'utilisateur authentifié
  getUserInfo: async (req, res) => {
    // Vérifier l'authentification
    if (!req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      const userId = parseInt(req.session.userId, 10);

      // Récupérer les informations de l'utilisateur connecté
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          pseudo: true,
          prenom: true,
          nom: true,
          email: true,
          theme: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Compter le nombre de notes de l'utilisateur
      const noteCount = await prisma.note.count({
        where: {
          authorId: userId,
        },
      });

      // Ajouter le nombre de notes aux informations utilisateur
      const userWithNoteCount = {
        ...user,
        noteCount,
      };

      return res.status(200).json(userWithNoteCount);
    } catch (error) {
      
      return res
        .status(500)
        .json({
          message:
            "Erreur lors de la récupération des informations utilisateur",
          error: error.message,
        });
    }
  },

  // Marquer un compte pour suppression (soft delete)
  requestAccountDeletion: async (req, res) => {
    // Vérifier l'authentification
    if (!req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      const userId = parseInt(req.session.userId, 10);

      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Vérifier si le compte n'est pas déjà marqué pour suppression
      if (user.deleted_at) {
        return res.status(400).json({
          message: "Ce compte est déjà marqué pour suppression",
          deletionDate: user.deleted_at,
        });
      }

      // Marquer le compte pour suppression
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          deleted_at: new Date(),
        },
      });

      // Envoyer un email de confirmation de suppression
      const { email } = user;
      try {
        await sendDeleteAccountEmail(email);
      } catch (emailError) {
        
        // On continue le processus même si l'email échoue
      }

      // Calculer la date de suppression définitive (1 minute pour test)
      const deletionDate = new Date(updatedUser.deleted_at);
      deletionDate.setMinutes(deletionDate.getMinutes() + 1); // TEST: 1 minute au lieu de 30 jours

      // 🚪 Détruire la session car l'utilisateur ne peut plus se connecter
      req.session.destroy((sessionError) => {
        if (sessionError) {
          
        }
      });

      return res.status(200).json({
        success: true,
        message: "Votre compte a été marqué pour suppression.",
        deletionDate: deletionDate.toISOString(),
      });
    } catch (error) {
      
      return res.status(500).json({
        message: "Erreur lors de la demande de suppression du compte",
        error: error.message,
      });
    }
  },

  // Annuler la suppression d'un compte (Pas pour tout de suite)
  cancelAccountDeletion: async (req, res) => {
    // Vérifier l'authentification
    if (!req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      const userId = parseInt(req.session.userId, 10);

      // Vérifier que l'utilisateur existe et est marqué pour suppression
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      if (!user.deleted_at) {
        return res.status(400).json({
          message: "Ce compte n'est pas marqué pour suppression",
        });
      }

      // Vérifier que les 30 jours ne sont pas écoulés
      const deletionDate = new Date(user.deleted_at);
      deletionDate.setDate(deletionDate.getDate() + 30);
      const now = new Date();

      // suppression définitive déjà effectuée
      if (now > deletionDate) {
        return res.status(400).json({
          message:
            "La période de grâce de 30 jours est écoulée. Le compte ne peut plus être récupéré.",
        });
      }

      // Annuler la suppression
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          deleted_at: null,
        },
      });

      return res.status(200).json({
        success: true,
        message: "La suppression de votre compte a été annulée avec succès.",
      });
    } catch (error) {
      
      return res.status(500).json({
        message: "Erreur lors de l'annulation de la suppression",
        error: error.message,
      });
    }
  },

  // Supprimer définitivement les comptes après 30 jours (fonction pour cron job)
  deleteExpiredAccounts: async (req, res) => {
    try {
      // Calculer la date limite (1 minute en arrière pour test)
      const oneMinuteAgo = new Date();
      oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1); // TEST: 1 minute au lieu de 30 jours

      // Trouver les comptes à supprimer définitivement
      const expiredUsers = await prisma.user.findMany({
        where: {
          deleted_at: {
            lte: oneMinuteAgo,
          },
        },
        include: {
          notes: true,
        },
      });

      let deletedCount = 0;

      for (const user of expiredUsers) {
        try {
          // 1. Supprimer d'abord toutes les permissions liées à cet utilisateur
          await prisma.permission.deleteMany({
            where: { userId: user.id },
          });

          // 2. Supprimer toutes les permissions liées aux notes de cet utilisateur
          const userNoteIds = user.notes.map((note) => note.id);
          if (userNoteIds.length > 0) {
            await prisma.permission.deleteMany({
              where: { noteId: { in: userNoteIds } },
            });
          }

          // 3. Supprimer toutes les notes de l'utilisateur
          await prisma.note.deleteMany({
            where: { authorId: user.id },
          });

          // 4. Finalement, supprimer l'utilisateur
          await prisma.user.delete({
            where: { id: user.id },
          });

          deletedCount++;
        } catch (deleteError) {
          
        }
      }

      return res.status(200).json({
        success: true,
        message: `${deletedCount} compte(s) supprimé(s) définitivement.`,
        deletedCount,
      });
    } catch (error) {
      
      return res.status(500).json({
        message: "Erreur lors de la suppression des comptes expirés",
        error: error.message,
      });
    }
  },

  updateUserInfo: async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const userId = parseInt(req.session.userId, 10);
    const { pseudo, prenom, nom, email } = req.body;

    try {
      // Préparer les données à mettre à jour en filtrant les valeurs vides
      const updateData = {};

      // Validation: ne pas accepter de valeurs vides ou seulement des espaces
      if (pseudo !== undefined) {
        const trimmedPseudo = pseudo.trim();
        if (trimmedPseudo === "") {
          return res.status(400).json({
            success: false,
            error: "Le pseudo ne peut pas être vide",
          });
        }
        updateData.pseudo = trimmedPseudo;
      }

      if (prenom !== undefined) {
        const trimmedPrenom = prenom.trim();
        if (trimmedPrenom === "") {
          return res.status(400).json({
            success: false,
            error: "Le prénom ne peut pas être vide",
          });
        }
        updateData.prenom = trimmedPrenom;
      }

      if (nom !== undefined) {
        const trimmedNom = nom.trim();
        if (trimmedNom === "") {
          return res.status(400).json({
            success: false,
            error: "Le nom ne peut pas être vide",
          });
        }
        updateData.nom = trimmedNom;
      }

      if (email !== undefined) {
        const trimmedEmail = email.trim();
        if (trimmedEmail === "") {
          return res.status(400).json({
            success: false,
            error: "L'email ne peut pas être vide",
          });
        }
        updateData.email = trimmedEmail;
      }

      // Si aucune donnée à mettre à jour
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: "Aucune donnée à mettre à jour",
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          pseudo: true,
          prenom: true,
          nom: true,
          email: true,
        },
      });

      return res.status(200).json({
        success: true,
        user: updatedUser,
      });
    } catch (error) {

      // Gestion des erreurs Prisma spécifiques
      if (error.code === "P2002") {
        return res.status(409).json({
          success: false,
          error: "Ce pseudo est déjà utilisé",
        });
      }

      return res.status(500).json({
        success: false,
        error: "Erreur lors de la mise à jour des informations utilisateur",
      });
    }
  },

  // Mettre à jour le thème de l'utilisateur
  updateUserTheme: async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const userId = parseInt(req.session.userId, 10);
    const { theme } = req.body;

    // Valider le thème
    const validThemes = ["light", "dark", "blue", "green", "purple", "night"];
    if (!theme || !validThemes.includes(theme)) {
      return res.status(400).json({
        message: "Thème invalide",
        validThemes,
      });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { theme },
        select: {
          id: true,
          theme: true,
        },
      });

      return res.status(200).json({
        success: true,
        theme: updatedUser.theme,
      });
    } catch (error) {
      
      return res.status(500).json({
        message: "Erreur lors de la mise à jour du thème",
        error: error.message,
      });
    }
  },

  // Mettre en place le code 2FA pour l'utilisateur
  setup2FA: async (req, res) => {

    // Générer un code numérique (6 chiffres) sécurisé
    const { randomInt } = await import("crypto");
    const codeLength = 6; // changer si besoin
    let a2f = Array.from({ length: codeLength }, () => randomInt(0, 10)).join('');
  
    if (!req.session.userId) {
      return res.status(500).json({ message: "Un problèmes est survenu" });
    }

    const redisUrl =
      process.env.REDIS_URL ??
      `redis://${process.env.REDIS_HOST ?? "127.0.0.1"}:${process.env.REDIS_PORT ?? "6380"}`;

    const redis = createClient({ url: redisUrl });

    await redis.connect();

    // Écrire une clé
    await redis.set(`${req.session.userId}`, `${a2f}`, { EX: 900 }); // expire dans 15 minutes

    await redis.quit();

    // Récupérer l'email de l'utilisateur et envoyer le code 2FA par email
    const userRecord = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { email: true },
    });

    await a2fEmail(userRecord.email, a2f);

    return res.status(200).json({ success: true, message: "Code 2FA envoyé par email" });

  },

  check2fa: async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const { code } = req.body;

    const redisUrl =
      process.env.REDIS_URL ??
      `redis://${process.env.REDIS_HOST ?? "127.0.0.1"}:${process.env.REDIS_PORT ?? "6380"}`;
    const redis = createClient({ url: redisUrl });
    
    await redis.connect();

    const storedCode = await redis.get(`${req.session.userId}`);
    
    await redis.quit();

    if (storedCode == code){
      try {
        await userController.info2fa(req, res);
      } catch (error) {
        
        return res.status(500).json({ 
          success: false, 
          message: "Erreur lors de l'envoi des informations utilisateur" 
        });
      }
    }
    else {
      return res.status(400).json({ success: false, message: "Code 2FA invalide" });
    }

  },

  // fonction qui récupère les infos utilisateur pour la récupération de données 

  info2fa: async(req, res) => {

    if (!req.session.userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    try {
      const userId = parseInt(req.session.userId, 10);

      const info = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        pseudo: true,
        nom: true,
        prenom: true,
        email: true,
        _count: {
        select: { notes: true },
        },
      },
      });

      if (!info) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Envoyer l'email avec les informations utilisateur
      await userDataEmail(
        info.email,
        {
          "Pseudonyme": info.pseudo,
          "Nom": info.nom,
          "Prénom": info.prenom,
          "E-mail": info.email,
          "Nombre de notes": info._count.notes,
        }
      );

      return res.status(200).json({
        success: true,
        message: "Email d'informations envoyé avec succès"
      });
    } catch (error) {
      
      return res.status(500).json({
      success: false,
      message: "Erreur"
      });
    }

  }

};

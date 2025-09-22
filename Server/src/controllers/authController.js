import bcrypt from 'bcrypt';
import { prisma } from '../app.js';
import { sendValidationEmail } from '../services/emailService.js';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';

const validateRegistration = [
    body('pseudo')
        .isLength({ min: 3 }).withMessage('Le pseudo doit avoir au moins 3 caractères')
        .matches(/^[a-zA-Z0-9]+$/).withMessage('Le pseudo ne doit contenir que des caractères alphanumériques'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password')
        .isLength({ min: 3 }).withMessage('Le mot de passe doit avoir au moins 3 caractères')
        // .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre')
        // .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Le mot de passe doit contenir au moins un caractère spécial')
];

const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Erreurs de validation:', errors.array());
        return res.render('register', {
            errors: errors.array(),
            pseudo: req.body.pseudo || '',
            email: req.body.email || ''
        });
    }

    const { pseudo, email, password } = req.body;

    try {
        let existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.render('register', {
                error: "Cet email est déjà utilisé."
            });
        }
        existing = await prisma.user.findUnique({ where: { pseudo } });
        if (existing) {
            return res.render('register', {
                error: "Ce pseudo est déjà utilisé."
            });
        }

        const token = crypto.randomBytes(32).toString('hex');
        await sendValidationEmail(email, token);
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                pseudo,
                email,
                password: hashedPassword,
                prenom: '',  // Champ requis dans votre schéma
                nom: '',     // Champ requis dans votre schéma
                is_verified: false,
                token
            }
        });

        console.log('Utilisateur créé:', user);
        res.render('register', { success: "Compte créé avec succès. Veuillez cliquer sur le lien envoyé par mail." });
    } catch (err) {
        console.error("Erreur création compte:", err);
        res.render('register', { error: "Erreur serveur. Réessayez plus tard." });
    }
};

const login = async (req, res) => {
    const { pseudo, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { pseudo } });
        if (!user) {
            console.log('Utilisateur non trouvé pour', pseudo);
            return res.render('index', { error: "Utilisateur non trouvé", pseudo });
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            console.log('Mot de passe incorrect pour', pseudo);
            return res.render('index', { error: "Mot de passe incorrect", pseudo });
        }

        if (!user.is_verified) {
            console.log('Compte non activé pour', user.pseudo);
            return res.render('index', { error: "Compte non activé", pseudo });
        }

        req.session.userId = user.id;
        req.session.pseudo = user.pseudo;
        await req.session.save();
        console.log('Session après login:', req.session);
        return res.redirect('/');
    } catch (err) {
        console.error('Erreur connexion', err);
        res.status(500).send('Erreur serveur');
    }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur destruction session:', err);
            return res.status(500).send('Erreur lors de la déconnexion');
        }
        res.clearCookie('connect.sid');
        return res.redirect('/');
    });
};

const validate = async (req, res) => {
    const { token } = req.params;
    console.log('Tentative de validation avec token:', token);
    try {
        const user = await prisma.user.findFirst({ where: { token } });
        console.log('Utilisateur trouvé:', user);
        if (!user || user.token.startsWith('VALIDATED_')) {
            console.log('Lien de validation invalide ou déjà utilisé pour token:', token);
            return res.status(400).send('Lien invalide, expiré ou déjà utilisé.');
        }
        await prisma.user.update({
            where: { id: user.id },
            data: {
                is_verified: true,
                token: 'VALIDATED_' + user.token // Marquer le token comme utilisé
            }
        });
        console.log('Utilisateur validé avec succès:', user.pseudo);
        req.session.userId = user.id;
        req.session.pseudo = user.pseudo;
        await req.session.save();
        console.log('Session après validation:', req.session);
        return res.redirect('/');
    } catch (err) {
        console.error('Erreur validation:', err);
        res.status(500).send('Erreur serveur');
    }
};

export { register, login, logout, validate, validateRegistration };

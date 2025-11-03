import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
    try {
        // Vérifier si l'utilisateur test existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email: 'test@yanotela.com' }
        });

        if (existingUser) {
            console.log('✅ Utilisateur test existe déjà');
            console.log('Email: test@yanotela.com');
            console.log('Mot de passe: test123');
            return;
        }

        // Créer le mot de passe hashé
        const hashedPassword = await bcrypt.hash('test123', 10);

        // Créer l'utilisateur test
        const testUser = await prisma.user.create({
            data: {
                pseudo: 'TestUser',
                prenom: 'Test',
                nom: 'User',
                email: 'test@yanotela.com',
                password: hashedPassword,
                token: 'test-token-' + Date.now(),
                is_verified: true // Déjà vérifié pour éviter les étapes de validation
            }
        });

        console.log('✅ Utilisateur test créé avec succès !');
        console.log('Email: test@yanotela.com');
        console.log('Mot de passe: test123');
        console.log('ID:', testUser.id);

    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'utilisateur test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestUser();
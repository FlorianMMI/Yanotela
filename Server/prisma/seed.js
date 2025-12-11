import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de seed pour initialiser les types de notifications
 * Lance avec: npx prisma db seed
 */
async function main() {
  console.log('🌱 Début du seed des types de notifications...');

  const notificationTypes = [
    {
      code: 'INVITATION',
      name: 'Invitations à collaborer',
      description: 'Notification lorsque quelqu\'un vous invite à collaborer sur une note',
      isActive: true,
    },
    {
      code: 'REMOVED',
      name: 'Exclusions de notes',
      description: 'Notification lorsque vous êtes retiré d\'une note partagée',
      isActive: true,
    },
    {
      code: 'NOTE_DELETED',
      name: 'Suppressions de notes',
      description: 'Notification lorsqu\'une note collaborative est supprimée',
      isActive: true,
    },
    {
      code: 'ROLE_CHANGED',
      name: 'Changements de rôle',
      description: 'Notification lorsque votre rôle change sur une note (promotion ou rétrogradation)',
      isActive: true,
    },
    {
      code: 'SOMEONE_INVITED',
      name: 'Nouveaux collaborateurs',
      description: 'Notification lorsqu\'un nouveau collaborateur rejoint une de vos notes',
      isActive: true,
    },
    {
      code: 'COLLABORATOR_REMOVED',
      name: 'Départs de collaborateurs',
      description: 'Notification lorsqu\'un collaborateur est retiré d\'une de vos notes',
      isActive: true,
    },
    {
      code: 'USER_LEFT',
      name: 'Utilisateurs qui quittent',
      description: 'Notification lorsqu\'un utilisateur quitte volontairement une note',
      isActive: true,
    },
    {
      code: 'COMMENT_ADDED',
      name: 'Nouveaux commentaires',
      description: 'Notification lorsqu\'un commentaire est ajouté sur une note partagée',
      isActive: true,
    },
  ];

  for (const type of notificationTypes) {
    const result = await prisma.notificationType.upsert({
      where: { code: type.code },
      update: {
        name: type.name,
        description: type.description,
        isActive: type.isActive,
      },
      create: type,
    });
    console.log(`✅ Type de notification créé/mis à jour: ${result.code} (ID: ${result.id})`);
  }

  const count = await prisma.notificationType.count();
  console.log(`\n🎉 Seed terminé ! ${count} types de notifications en base de données.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erreur lors du seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

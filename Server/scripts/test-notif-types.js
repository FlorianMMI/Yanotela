import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNotificationTypes() {
  try {
    console.log('🔍 Test de récupération des types de notifications...\n');
    
    const types = await prisma.notificationType.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log(`✅ ${types.length} types trouvés:\n`);
    types.forEach(type => {
      console.log(`  - ${type.code}: ${type.name} (ID: ${type.id}, Active: ${type.isActive})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationTypes();

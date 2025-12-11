import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNotificationTypes() {
  try {

    const types = await prisma.notificationType.findMany({
      orderBy: { id: 'asc' }
    });

    types.forEach(type => {
      
    });
    
  } catch (error) {

  } finally {
    await prisma.$disconnect();
  }
}

testNotificationTypes();

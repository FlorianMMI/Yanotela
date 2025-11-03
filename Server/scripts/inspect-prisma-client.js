import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectClient() {
  try {
    console.log('Prisma client keys:', Object.keys(prisma).sort());
    // Print a couple of example model functions if present
    ['note','user','permission','dossier'].forEach(k => {
      
    });
  } catch (e) {
    console.error('Error inspecting Prisma client:', e);
  } finally {
    await prisma.$disconnect();
  }
}

inspectClient();
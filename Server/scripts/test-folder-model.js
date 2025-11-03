import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFolderModel() {
  try {

    // Check if folder model exists
    if (!prisma.folder) {
      console.error('❌ prisma.folder is undefined!');
      console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));
      process.exit(1);
    }

    // Try to count folders (safe operation)
    const count = await prisma.folder.count();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testFolderModel();

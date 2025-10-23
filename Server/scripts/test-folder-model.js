import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFolderModel() {
  try {
    console.log('🔍 Testing Prisma Folder model...\n');
    
    // Check if folder model exists
    if (!prisma.folder) {
      console.error('❌ prisma.folder is undefined!');
      console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));
      process.exit(1);
    }
    
    console.log('✅ prisma.folder exists');
    
    // Try to count folders (safe operation)
    const count = await prisma.folder.count();
    console.log(`📊 Total folders in database: ${count}`);
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testFolderModel();

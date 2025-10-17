import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Reset the User id sequence to start from 1 (or max id + 1 if users exist)
    await prisma.$executeRawUnsafe(
      `SELECT setval('"User_id_seq"', COALESCE((SELECT MAX(id) + 1 FROM "User"), 1), false);`
    );
    console.log('✅ User id sequence reset successfully');
    
    // Show current max id for verification
    const result = await prisma.$queryRawUnsafe(`SELECT MAX(id) as max_id FROM "User"`);
    console.log('Current max User id:', result);
  } catch (error) {
    console.error('❌ Error resetting sequence:', error);
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

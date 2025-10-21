import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkParentCredentials() {
  try {
    console.log('🔍 Checking parent credentials...\n');

    const children = await prisma.child.findMany({
      select: {
        fullName: true,
        parentName: true,
        parentEmail: true,
        parentPassword: true
      }
    });

    console.log('👶 Children with parent credentials:');
    if (children.length === 0) {
      console.log('  No children found');
    } else {
      children.forEach(child => {
        console.log(`  - ${child.fullName} (Parent: ${child.parentName})`);
        console.log(`    Email: ${child.parentEmail}`);
        console.log(`    Password: ${child.parentPassword}`);
      });
    }

    console.log('\n✅ Parent credentials check complete');

  } catch (error) {
    console.error('❌ Error checking parent credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkParentCredentials();

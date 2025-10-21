import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users...\n');

    // Check users in User table
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    console.log('👥 Users in User table:');
    if (users.length === 0) {
      console.log('  No users found');
    } else {
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }

    // Check children with parent credentials
    const children = await prisma.child.findMany({
      select: {
        id: true,
        fullName: true,
        parentName: true,
        parentEmail: true,
        parentPassword: true
      }
    });

    console.log('\n👶 Children with parent credentials:');
    if (children.length === 0) {
      console.log('  No children found');
    } else {
      children.forEach(child => {
        console.log(`  - ${child.fullName} (Parent: ${child.parentName})`);
        console.log(`    Email: ${child.parentEmail}`);
        console.log(`    Password: ${child.parentPassword ? 'Set' : 'Not set'}`);
      });
    }

    console.log('\n✅ Database check complete');

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

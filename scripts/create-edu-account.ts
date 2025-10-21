import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createEduAccount() {
  try {
    console.log('🔧 Creating account for edu@gmail.com...\n');

    // Create admin account with edu@gmail.com
    const adminPassword = await bcrypt.hash('edu123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'edu@gmail.com' },
      update: {},
      create: {
        id: 'edu-admin-001',
        name: 'Edu Admin',
        email: 'edu@gmail.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin account created:', admin.email);

    // Also create a parent account with the same email
    const parentPassword = await bcrypt.hash('edu123', 10);
    const parent = await prisma.user.upsert({
      where: { email: 'edu-parent@gmail.com' },
      update: {},
      create: {
        id: 'edu-parent-001',
        name: 'Edu Parent',
        email: 'edu-parent@gmail.com',
        password: parentPassword,
        role: 'PARENT',
      },
    });
    console.log('✅ Parent account created:', parent.email);

    // Create a child with parent credentials
    const org = await prisma.organization.findFirst();
    const room = await prisma.room.findFirst();
    
    if (org && room) {
      const child = await prisma.child.upsert({
        where: { id: 999 },
        update: {},
        create: {
          id: 999,
          fullName: 'Edu Child',
          dateOfBirth: new Date('2020-01-01'),
          gender: 'MALE',
          relationship: 'FATHER',
          parentName: 'Edu Parent',
          parentEmail: 'edu@gmail.com',
          parentPassword: 'edu123',
          site: 'INSA',
          organizationId: org.id,
          roomId: room.id,
          option: 'Full Day',
        },
      });
      console.log('✅ Child created with parent credentials:', child.fullName);
    }

    console.log('\n🎉 Account creation complete!');
    console.log('\n📋 New Login Credentials:');
    console.log('Admin Login:');
    console.log('  Email: edu@gmail.com');
    console.log('  Password: edu123');
    console.log('\nParent Login (User Account):');
    console.log('  Email: edu-parent@gmail.com');
    console.log('  Password: edu123');
    console.log('\nParent Login (Child Parent Credentials):');
    console.log('  Email: edu@gmail.com');
    console.log('  Password: edu123');

  } catch (error) {
    console.error('❌ Error creating account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createEduAccount();

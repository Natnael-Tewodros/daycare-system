import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestAccounts() {
  try {
    console.log('Creating test accounts...');

    // Create test admin account
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        id: 'admin-test-001',
        name: 'Test Admin',
        email: 'admin@test.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin account created:', admin.email);

    // Create test parent account
    const parentPassword = await bcrypt.hash('parent123', 10);
    const parent = await prisma.user.upsert({
      where: { email: 'parent@test.com' },
      update: {},
      create: {
        id: 'parent-test-001',
        name: 'Test Parent',
        email: 'parent@test.com',
        password: parentPassword,
        role: 'PARENT',
      },
    });
    console.log('✅ Parent account created:', parent.email);

    // Create test organization
    const org = await prisma.organization.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Test Daycare',
        type: 'INSA',
      },
    });
    console.log('✅ Organization created:', org.name);

    // Create test rooms with proper class names
    const infantRoom = await prisma.room.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Infant',
        ageRange: '0 months - 18 months',
        organizationId: org.id,
      },
    });
    console.log('✅ Infant room created:', infantRoom.name);

    const toddlerRoom = await prisma.room.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Toddler',
        ageRange: '18 months - 3 years',
        organizationId: org.id,
      },
    });
    console.log('✅ Toddler room created:', toddlerRoom.name);

    const niceRoom = await prisma.room.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: 'Nice',
        ageRange: '3 years - 5 years',
        organizationId: org.id,
      },
    });
    console.log('✅ Nice room created:', niceRoom.name);

    // Create test child with parent credentials
    const child = await prisma.child.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        fullName: 'Test Child',
        dateOfBirth: new Date('2020-01-01'),
        gender: 'MALE',
        relationship: 'FATHER',
        parentName: 'Test Parent',
        parentEmail: 'parent@test.com',
        parentPassword: 'parent123',
        site: 'HEADOFFICE',
        organizationId: org.id,
        roomId: infantRoom.id,
        option: 'Full Day',
      },
    });
    console.log('✅ Child created:', child.fullName);

    console.log('\n🎉 Test accounts created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin Login:');
    console.log('  Email: admin@test.com');
    console.log('  Password: admin123');
    console.log('\nParent Login:');
    console.log('  Email: parent@test.com');
    console.log('  Password: parent123');

  } catch (error) {
    console.error('❌ Error creating test accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAccounts();

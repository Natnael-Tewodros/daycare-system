import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed - Creating Admin User only...\n');

  // Create Admin User
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      password: hashedAdminPassword, // Update password in case admin exists
    },
    create: {
      id: 'admin-' + Date.now(),
      name: 'Admin User',
      username: 'admin',
      email: 'admin@gmail.com',
      password: hashedAdminPassword,
      role: 'ADMIN',
      profileImage: null,
    },
  });

  console.log('✅ Admin user created/updated successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('================================');
  console.log('  Email: admin@gmail.com');
  console.log('  Password: admin123');
  console.log('  Role: ADMIN');
  console.log('\n✅ Seed completed! You can now login as admin and create organizations, parents, children, etc. from the dashboard.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });


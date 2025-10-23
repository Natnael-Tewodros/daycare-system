const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAdminLogin() {
  try {
    console.log('🧪 Testing admin login functionality...\n');

    // Test credentials
    const testCredentials = [
      { email: 'admin@daycare.com', password: 'admin123' },
      { email: 'edu@gmail.com', password: 'edu123' }
    ];

    for (const cred of testCredentials) {
      console.log(`Testing: ${cred.email}`);
      
      // Find user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: cred.email.toLowerCase(), mode: 'insensitive' } },
            { username: { equals: cred.email, mode: 'insensitive' } },
          ],
        },
      });

      if (!user) {
        console.log(`  ❌ User not found`);
        continue;
      }

      console.log(`  ✅ User found: ${user.name} (${user.email})`);
      console.log(`  Role: ${user.role}`);

      // Test password
      const isPasswordValid = await bcrypt.compare(cred.password, user.password);
      console.log(`  Password valid: ${isPasswordValid ? '✅' : '❌'}`);

      if (isPasswordValid) {
        console.log(`  🎉 Login would succeed!`);
      } else {
        console.log(`  🔒 Login would fail - wrong password`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error testing admin login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLogin();

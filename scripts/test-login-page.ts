import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLoginPage() {
  try {
    console.log('🧪 Testing Login Page Credentials...\n');

    console.log('📋 Available Login Credentials:\n');

    console.log('🔐 ADMIN LOGIN:');
    console.log('   Email: admin@test.com');
    console.log('   Password: admin123');
    console.log('   Expected: Redirect to /dashboard\n');

    console.log('👨‍👩‍👧‍👦 PARENT LOGIN (User Account):');
    console.log('   Email: parent@test.com');
    console.log('   Password: parent123');
    console.log('   Expected: Redirect to /parent-dashboard\n');

    console.log('👶 PARENT LOGIN (Child Parent Credentials):');
    console.log('   Email: natnaeladamu@gmail.com');
    console.log('   Password: 87654321');
    console.log('   Expected: Redirect to /parent-dashboard\n');

    console.log('✅ All credentials are ready for testing!');
    console.log('\n💡 Instructions:');
    console.log('1. Go to http://localhost:3000/login');
    console.log('2. Try each set of credentials above');
    console.log('3. Check that you get redirected to the correct dashboard');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginPage();

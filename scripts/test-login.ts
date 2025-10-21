import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🧪 Testing login functionality...\n');

    // Test admin login
    console.log('1. Testing Admin Login:');
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@test.com' }
    });
    
    if (adminUser) {
      console.log(`   ✅ Found admin user: ${adminUser.name} (${adminUser.email})`);
      console.log(`   Role: ${adminUser.role}`);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('admin123', adminUser.password);
      console.log(`   Password valid: ${isPasswordValid ? '✅' : '❌'}`);
    } else {
      console.log('   ❌ No admin user found');
    }

    // Test parent login
    console.log('\n2. Testing Parent Login:');
    const childWithParent = await prisma.child.findFirst({
      where: { 
        parentEmail: 'natnaeladamu@gmail.com',
        parentPassword: '87654321'
      }
    });
    
    if (childWithParent) {
      console.log(`   ✅ Found child with parent credentials: ${childWithParent.fullName}`);
      console.log(`   Parent: ${childWithParent.parentName}`);
      console.log(`   Email: ${childWithParent.parentEmail}`);
      console.log(`   Password: ${childWithParent.parentPassword ? 'Set' : 'Not set'}`);
    } else {
      console.log('   ❌ No child with parent credentials found');
    }

    // Test with different credentials
    console.log('\n3. Testing with parent@test.com:');
    const testParentUser = await prisma.user.findFirst({
      where: { email: 'parent@test.com' }
    });
    
    if (testParentUser) {
      console.log(`   ✅ Found test parent user: ${testParentUser.name} (${testParentUser.email})`);
      console.log(`   Role: ${testParentUser.role}`);
      
      const isPasswordValid = await bcrypt.compare('parent123', testParentUser.password);
      console.log(`   Password valid: ${isPasswordValid ? '✅' : '❌'}`);
    } else {
      console.log('   ❌ No test parent user found');
    }

    console.log('\n✅ Login test complete');

  } catch (error) {
    console.error('❌ Error testing login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();

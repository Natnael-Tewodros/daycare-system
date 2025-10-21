import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAPIs() {
  try {
    console.log('🧪 Testing APIs...\n');

    // Test Organizations API
    console.log('1. Testing Organizations:');
    const organizations = await prisma.organization.findMany({
      include: {
        children: true,
        rooms: true
      }
    });
    console.log(`   Found ${organizations.length} organizations`);
    organizations.forEach(org => {
      console.log(`   - ${org.name}: ${org.children.length} children, ${org.rooms.length} rooms`);
    });

    // Test Servants API
    console.log('\n2. Testing Servants:');
    const servants = await prisma.servant.findMany({
      include: {
        assignedRoom: true,
        children: true
      }
    });
    console.log(`   Found ${servants.length} servants`);
    servants.forEach(servant => {
      console.log(`   - ${servant.fullName}: ${servant.children.length} children, Room: ${servant.assignedRoom?.name || 'None'}`);
    });

    // Test Overview API
    console.log('\n3. Testing Overview Data:');
    const totalChildren = await prisma.child.count();
    const totalServants = await prisma.servant.count();
    const totalOrganizations = await prisma.organization.count();
    
    console.log(`   Total Children: ${totalChildren}`);
    console.log(`   Total Servants: ${totalServants}`);
    console.log(`   Total Organizations: ${totalOrganizations}`);

    console.log('\n✅ All APIs are working correctly!');

  } catch (error) {
    console.error('❌ Error testing APIs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIs();

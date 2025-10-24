const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if there are any children
    const childrenCount = await prisma.child.count();
    console.log(`📊 Total children in database: ${childrenCount}`);
    
    // Check if there are any children with parent credentials
    const childrenWithParentCredentials = await prisma.child.findMany({
      where: {
        AND: [
          { parentEmail: { not: null } },
          { parentPassword: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        parentName: true,
        parentEmail: true,
        parentPassword: true
      }
    });
    
    console.log(`👨‍👩‍👧‍👦 Children with parent credentials: ${childrenWithParentCredentials.length}`);
    
    if (childrenWithParentCredentials.length > 0) {
      console.log('Sample parent credentials:');
      childrenWithParentCredentials.slice(0, 3).forEach(child => {
        console.log(`  - ${child.fullName} (${child.parentName}): ${child.parentEmail} / ${child.parentPassword}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createInitialSites() {
  try {
    console.log('🌱 Creating initial sites...');

    // Check if sites already exist
    const existingSites = await prisma.site.findMany();
    if (existingSites.length > 0) {
      console.log('✅ Sites already exist, skipping creation.');
      console.log('📝 Existing Sites:');
      console.log('================================');
      existingSites.forEach(site => {
        console.log(`${site.id}. ${site.name}`);
      });
      console.log('================================');
      return;
    }

    // Create Head Office site
    const headOffice = await prisma.site.create({
      data: {
        name: 'Head Office',
        description: 'Main administrative office and primary daycare facility',
        logo: '/insa.jpeg',
        address: '123 Main Street, Addis Ababa, Ethiopia',
        phone: '+251-11-123-4567',
        email: 'headoffice@daycare.com',
        website: 'https://daycare.com',
        isActive: true
      }
    });

    // Create Operation site
    const operation = await prisma.site.create({
      data: {
        name: 'Operation Center',
        description: 'Secondary daycare facility and operational center',
        address: '456 Business District, Addis Ababa, Ethiopia',
        phone: '+251-11-987-6543',
        email: 'operation@daycare.com',
        website: 'https://daycare.com/operation',
        isActive: true
      }
    });

    console.log('✅ Sites created successfully!');
    console.log('📝 Created Sites:');
    console.log('================================');
    console.log(`1. ${headOffice.name} (ID: ${headOffice.id})`);
    console.log(`2. ${operation.name} (ID: ${operation.id})`);
    console.log('================================');

  } catch (error) {
    console.error('❌ Error creating sites:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialSites();

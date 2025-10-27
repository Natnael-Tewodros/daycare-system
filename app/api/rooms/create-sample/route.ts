import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Create standard rooms for all organizations
export async function POST() {
  try {
    // Get all organizations
    const organizations = await prisma.organization.findMany();

    if (organizations.length === 0) {
      return NextResponse.json({ 
        error: 'No organizations found. Please create organizations first.' 
      }, { status: 400 });
    }

    const createdRooms = [];

    for (const org of organizations) {
      // Check if rooms already exist for this organization
      const existingRooms = await prisma.room.findMany({
        where: { organizationId: org.id }
      });

      if (existingRooms.length > 0) {
        console.log(`Rooms already exist for organization: ${org.name}`);
        continue;
      }

      // Create the three standard rooms
      const room1 = await prisma.room.create({
        data: {
          name: 'Room 1',
          ageRange: '3 months - 1 year',
          organizationId: org.id
        }
      });

      const room2 = await prisma.room.create({
        data: {
          name: 'Room 2',
          ageRange: '1 year - 2 years',
          organizationId: org.id
        }
      });

      const room3 = await prisma.room.create({
        data: {
          name: 'Room 3',
          ageRange: '2 years - 4 years',
          organizationId: org.id
        }
      });

      createdRooms.push(room1, room2, room3);
      console.log(`Created rooms for organization: ${org.name}`);
    }

    return NextResponse.json({ 
      success: true,
      message: `Created ${createdRooms.length} rooms for ${organizations.length} organization(s)`,
      rooms: createdRooms
    });

  } catch (error) {
    console.error('Error creating sample rooms:', error);
    return NextResponse.json({ 
      error: 'Failed to create sample rooms',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


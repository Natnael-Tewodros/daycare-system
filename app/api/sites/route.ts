import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all available sites with their data
export async function GET() {
  try {
    // Get all children grouped by site
    const childrenBySite = await prisma.child.groupBy({
      by: ['site'],
      _count: {
        id: true
      }
    });

    // Get all servants grouped by site
    const servantsBySite = await prisma.servant.groupBy({
      by: ['site'],
      _count: {
        id: true
      }
    });

    // Get all organizations
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        type: true
      }
    });

    // Get all rooms
    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        name: true,
        organizationId: true
      }
    });

    // Build sites data
    const sitesData = {
      HeadOffice: {
        name: 'HeadOffice',
        description: 'HeadOffice Site',
        children: [],
        servants: [],
        totalChildren: childrenBySite.find(group => group.site === 'INSA')?._count.id || 0,
        totalServants: servantsBySite.find(group => group.site === 'INSA')?._count.id || 0,
        totalOrganizations: organizations.length, // All organizations are available to both sites
        totalRooms: rooms.length // All rooms are available to both sites
      },
      OPERATION: {
        name: 'Operation',
        description: 'Operation Site',
        children: [],
        servants: [],
        totalChildren: childrenBySite.find(group => group.site === 'OPERATION')?._count.id || 0,
        totalServants: servantsBySite.find(group => group.site === 'OPERATION')?._count.id || 0,
        totalOrganizations: organizations.length, // All organizations are available to both sites
        totalRooms: rooms.length // All rooms are available to both sites
      }
    };

    return NextResponse.json(sitesData);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }
}

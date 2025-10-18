import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all sites with statistics
export async function GET() {
  try {
    // Get all children and servants grouped by site
    const children = await prisma.child.findMany({
      include: {
        organization: true,
        servant: true,
        room: true,
      },
    });

    const servants = await prisma.servant.findMany({
      include: {
        assignedRoom: true,
        children: true,
      },
    });

    // Calculate statistics for each site
    const siteStats = {
      INSA: {
        name: "INSA",
        description: "Information Network Security Agency",
        children: children.filter(c => c.site === 'INSA'),
        servants: servants.filter(s => s.site === 'INSA'),
        totalChildren: children.filter(c => c.site === 'INSA').length,
        totalServants: servants.filter(s => s.site === 'INSA').length,
        totalOrganizations: [...new Set(children.filter(c => c.site === 'INSA').map(c => c.organizationId))].length,
        totalRooms: [...new Set(children.filter(c => c.site === 'INSA' && c.roomId).map(c => c.roomId))].length,
      },
      OPERATION: {
        name: "OPERATION",
        description: "Operation Center",
        children: children.filter(c => c.site === 'OPERATION'),
        servants: servants.filter(s => s.site === 'OPERATION'),
        totalChildren: children.filter(c => c.site === 'OPERATION').length,
        totalServants: servants.filter(s => s.site === 'OPERATION').length,
        totalOrganizations: [...new Set(children.filter(c => c.site === 'OPERATION').map(c => c.organizationId))].length,
        totalRooms: [...new Set(children.filter(c => c.site === 'OPERATION' && c.roomId).map(c => c.roomId))].length,
      },
    };

    return NextResponse.json(siteStats);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }
}

// POST create a new site (if needed in the future)
export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();
    
    // For now, we only support INSA and OPERATION sites
    // This endpoint can be extended in the future if needed
    return NextResponse.json({ 
      message: 'Sites are predefined as INSA and OPERATION',
      availableSites: ['INSA', 'OPERATION']
    });
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 });
  }
}


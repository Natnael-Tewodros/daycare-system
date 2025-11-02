import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    // Get all caregivers, optionally excluding those already assigned to a specific room
    const caregivers = await prisma.caregiver.findMany({
      where: roomId ? {
        OR: [
          { assignedRoomId: null },
          { assignedRoomId: parseInt(roomId) }
        ]
      } : {},
      include: {
        assignedRoom: {
          select: { id: true, name: true, ageRange: true }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    return NextResponse.json(caregivers);
  } catch (error) {
    console.error('Error fetching available caregivers:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch available caregivers' 
    }, { status: 500 });
  }
}

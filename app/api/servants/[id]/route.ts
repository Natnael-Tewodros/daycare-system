import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { assignedRoomId } = await request.json();
    const servantId = parseInt(params.id);

    const updatedServant = await prisma.servant.update({
      where: { id: servantId },
      data: { assignedRoomId: assignedRoomId },
      include: {
        assignedRoom: {
          select: { id: true, name: true, ageRange: true }
        }
      }
    });

    return NextResponse.json(updatedServant);
  } catch (error) {
    console.error('Error updating servant room assignment:', error);
    return NextResponse.json({ 
      error: 'Failed to update room assignment' 
    }, { status: 500 });
  }
}
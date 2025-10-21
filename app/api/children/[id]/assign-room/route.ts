import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { roomId } = await request.json();
    const childId = parseInt(params.id);

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const updatedChild = await prisma.child.update({
      where: { id: childId },
      data: { roomId: parseInt(roomId) },
      include: {
        room: {
          select: { id: true, name: true, ageRange: true }
        },
        parent: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Child assigned to room successfully', 
      child: updatedChild 
    });
  } catch (error) {
    console.error('Error assigning child to room:', error);
    return NextResponse.json({ 
      error: 'Failed to assign child to room' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { caregiverId } = await request.json();
    const roomId = parseInt(params.id);

    if (!caregiverId) {
      return NextResponse.json({ 
        error: 'Caregiver ID is required' 
      }, { status: 400 });
    }

    // Verify room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { caregivers: true }
    });

    if (!room) {
      return NextResponse.json({ 
        error: 'Room not found' 
      }, { status: 404 });
    }

    // Verify caregiver exists
    const caregiver = await prisma.caregiver.findUnique({
      where: { id: caregiverId }
    });

    if (!caregiver) {
      return NextResponse.json({ 
        error: 'Caregiver not found' 
      }, { status: 404 });
    }

    // Check if caregiver is already assigned to this room
    const isAlreadyAssigned = room.caregivers.some(caregiver => caregiver.id === caregiverId);
    
    if (isAlreadyAssigned) {
      return NextResponse.json({ 
        error: 'Caregiver is already assigned to this room' 
      }, { status: 400 });
    }

    // Update caregiver's assigned room
    const updatedCaregiver = await prisma.caregiver.update({
      where: { id: caregiverId },
      data: { assignedRoomId: roomId },
      include: {
        assignedRoom: {
          select: { id: true, name: true, ageRange: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Caregiver assigned to room successfully',
      caregiver: updatedCaregiver
    });
  } catch (error) {
    console.error('Error assigning caregiver to room:', error);
    return NextResponse.json({ 
      error: 'Failed to assign caregiver to room' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { caregiverId } = await request.json();
    const roomId = parseInt(params.id);

    if (!caregiverId) {
      return NextResponse.json({ 
        error: 'Caregiver ID is required' 
      }, { status: 400 });
    }

    // Verify caregiver is assigned to this room
    const caregiver = await prisma.caregiver.findFirst({
      where: { 
        id: caregiverId,
        assignedRoomId: roomId
      }
    });

    if (!caregiver) {
      return NextResponse.json({ 
        error: 'Caregiver is not assigned to this room' 
      }, { status: 404 });
    }

    // Remove caregiver from room
    const updatedCaregiver = await prisma.caregiver.update({
      where: { id: caregiverId },
      data: { assignedRoomId: null }
    });

    return NextResponse.json({
      success: true,
      message: 'Caregiver removed from room successfully',
      caregiver: updatedCaregiver
    });
  } catch (error) {
    console.error('Error removing caregiver from room:', error);
    return NextResponse.json({ 
      error: 'Failed to remove caregiver from room' 
    }, { status: 500 });
  }
}

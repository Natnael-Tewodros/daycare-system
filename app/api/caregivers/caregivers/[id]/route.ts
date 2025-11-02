import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const caregiverId = parseInt(params.id);

    // Handle JSON request (simple room assignment update from table)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      
      if (body.assignedRoomId !== undefined) {
        const updatedCaregiver = await prisma.caregiver.update({
          where: { id: caregiverId },
          data: { 
            assignedRoomId: body.assignedRoomId === null || body.assignedRoomId === 'none' 
              ? null 
              : parseInt(body.assignedRoomId as string) 
          },
          include: {
            assignedRoom: {
              select: { id: true, name: true, ageRange: true }
            }
          }
        });
        return NextResponse.json(updatedCaregiver);
      }
    }

    // Handle form data request (full update with files)
    const formData = await request.formData();
    
    // Check if this is a room assignment update (from the table via form data)
    const assignedRoomId = formData.get('assignedRoomId');
    if (assignedRoomId !== null) {
      const updatedCaregiver = await prisma.caregiver.update({
        where: { id: caregiverId },
        data: { assignedRoomId: assignedRoomId === 'none' ? null : parseInt(assignedRoomId as string) },
        include: {
          assignedRoom: {
            select: { id: true, name: true, ageRange: true }
          }
        }
      });
      return NextResponse.json(updatedCaregiver);
    }

    // Full update with form data
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const site = formData.get('site') as string;
    const organizationType = formData.get('organizationType') as string;
    const canTransferRooms = formData.get('canTransferRooms') === 'true';
    const medicalReportFile = formData.get('medicalReport') as File | null;

    // Only email is required
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if email already exists (excluding current caregiver)
    const existingCaregiver = await prisma.caregiver.findFirst({
      where: {
        email,
        id: { not: caregiverId }
      }
    });

    if (existingCaregiver) {
      return NextResponse.json({ error: 'A caregiver with this email already exists' }, { status: 409 });
    }

    const updateData: any = {
      fullName: fullName || null,
      email,
      phone: phone || null,
      siteId: null, // TODO: Update to use actual site ID from database
      organizationType: organizationType ? (organizationType as "INSA" | "AI" | "MINISTRY_OF_PEACE" | "FINANCE_SECURITY") : undefined,
      canTransferRooms
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Handle medical report file upload
    if (medicalReportFile && medicalReportFile.size > 0) {
      // Validate file type
      if (medicalReportFile.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Only PDF files are allowed for medical reports' }, { status: 400 });
      }

      const bytes = await medicalReportFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `medical-report-${caregiverId}-${Date.now()}.pdf`;
      const path = `public/uploads/${filename}`;
      
      // Save file (in a real app, you'd use a proper file storage service)
      const fs = require('fs');
      const pathModule = require('path');
      const uploadDir = pathModule.join(process.cwd(), 'public', 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.writeFileSync(pathModule.join(process.cwd(), path), buffer);
      updateData.medicalReport = filename;
    }

    const updatedCaregiver = await prisma.caregiver.update({
      where: { id: caregiverId },
      data: updateData,
      include: {
        assignedRoom: {
          select: { id: true, name: true, ageRange: true }
        }
      }
    });

    return NextResponse.json(updatedCaregiver);
  } catch (error) {
    console.error('Error updating caregiver:', error);
    return NextResponse.json({ 
      error: 'Failed to update caregiver' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caregiverId = parseInt(params.id);

    // Check if caregiver exists
    const caregiver = await prisma.caregiver.findUnique({
      where: { id: caregiverId }
    });

    if (!caregiver) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 });
    }

    // Delete the caregiver
    await prisma.caregiver.delete({
      where: { id: caregiverId }
    });

    return NextResponse.json({ message: 'Caregiver deleted successfully' });
  } catch (error) {
    console.error('Error deleting caregiver:', error);
    return NextResponse.json({ 
      error: 'Failed to delete caregiver' 
    }, { status: 500 });
  }
}
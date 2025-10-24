import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const servantId = parseInt(params.id);

    // Check if this is a room assignment update (from the table)
    const assignedRoomId = formData.get('assignedRoomId');
    if (assignedRoomId !== null) {
      const updatedServant = await prisma.servant.update({
        where: { id: servantId },
        data: { assignedRoomId: assignedRoomId === 'none' ? null : parseInt(assignedRoomId as string) },
        include: {
          assignedRoom: {
            select: { id: true, name: true, ageRange: true }
          }
        }
      });
      return NextResponse.json(updatedServant);
    }

    // Full update with form data
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const site = formData.get('site') as string;
    const organizationType = formData.get('organizationType') as string;
    const canTransferRooms = formData.get('canTransferRooms') === 'true';
    const medicalReportFile = formData.get('medicalReport') as File | null;

    if (!fullName || !email || !phone || !site || !organizationType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if email already exists (excluding current servant)
    const existingServant = await prisma.servant.findFirst({
      where: {
        email,
        id: { not: servantId }
      }
    });

    if (existingServant) {
      return NextResponse.json({ error: 'A caregiver with this email already exists' }, { status: 409 });
    }

    const updateData: any = {
      fullName,
      email,
      phone,
      site: site as "HEADOFFICE" | "OPERATION",
      organizationType: organizationType as "INSA" | "AI" | "MINISTRY_OF_PEACE" | "FINANCE_SECURITY",
      canTransferRooms
    };

    // Handle medical report file upload
    if (medicalReportFile && medicalReportFile.size > 0) {
      // Validate file type
      if (medicalReportFile.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Only PDF files are allowed for medical reports' }, { status: 400 });
      }

      const bytes = await medicalReportFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `medical-report-${servantId}-${Date.now()}.pdf`;
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

    const updatedServant = await prisma.servant.update({
      where: { id: servantId },
      data: updateData,
      include: {
        assignedRoom: {
          select: { id: true, name: true, ageRange: true }
        }
      }
    });

    return NextResponse.json(updatedServant);
  } catch (error) {
    console.error('Error updating servant:', error);
    return NextResponse.json({ 
      error: 'Failed to update servant' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const servantId = parseInt(params.id);

    // Check if servant exists
    const servant = await prisma.servant.findUnique({
      where: { id: servantId }
    });

    if (!servant) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 });
    }

    // Delete the servant
    await prisma.servant.delete({
      where: { id: servantId }
    });

    return NextResponse.json({ message: 'Caregiver deleted successfully' });
  } catch (error) {
    console.error('Error deleting servant:', error);
    return NextResponse.json({ 
      error: 'Failed to delete caregiver' 
    }, { status: 500 });
  }
}
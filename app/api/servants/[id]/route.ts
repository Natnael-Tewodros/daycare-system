// app/api/servants/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { mkdir, unlink } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const servant = await prisma.servant.findUnique({
      where: { id },
      include: {
        assignedRoom: true,
      },
    });
    if (!servant) {
      return NextResponse.json({ error: 'Servant not found' }, { status: 404 });
    }
    return NextResponse.json(servant);
  } catch (error) {
    console.error('Error fetching servant:', error);
    return NextResponse.json({ error: 'Failed to fetch servant' }, { status: 500 });
  }
}

async function handleFileUpload(file: File) {
  // Define the upload directory
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${file.name}`;
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  return filename;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const formData = await request.formData();
    const fullName = (formData.get('fullName') as string || '').trim();
    const email = ((formData.get('email') as string) || '').trim() || null;
    const phone = (formData.get('phone') as string || '').trim();
    const assignedRoomIdStr = formData.get('assignedRoomId') as string;
    const canTransferRoomsStr = formData.get('canTransferRooms') as string;
    const site = formData.get('site') as string;
    const organizationType = formData.get('organizationType') as string;
    const assignedByChildIdsStr = formData.getAll('assignedByChildIds');

    const assignedRoomId = assignedRoomIdStr === 'none' ? null : (assignedRoomIdStr ? parseInt(assignedRoomIdStr) : null);
    const canTransferRooms = canTransferRoomsStr === 'true';
    const assignedByChildIds = Array.isArray(assignedByChildIdsStr)
      ? (assignedByChildIdsStr as string[]).map((v) => parseInt(v)).filter((v) => !Number.isNaN(v))
      : [];

    const servant = await prisma.servant.findUnique({ where: { id } });
    if (!servant) {
      return NextResponse.json({ error: 'Servant not found' }, { status: 404 });
    }

    if (!fullName || !phone) {
      return NextResponse.json({ error: 'Full name and phone are required' }, { status: 400 });
    }

    if (!site || !organizationType) {
      return NextResponse.json({ error: 'Site and organization type are required' }, { status: 400 });
    }

    const updateData: any = {
      fullName,
      email,
      phone,
      assignedRoomId,
      canTransferRooms,
      site: site as any,
      organizationType: organizationType as any,
    };

    const medicalReportFile = formData.get('medicalReport') as File | null;
    if (medicalReportFile && medicalReportFile.size > 0) {
      const newFilename = await handleFileUpload(medicalReportFile);
      updateData.medicalReport = newFilename;

      // Delete old file if exists
      if (servant.medicalReport) {
        const oldFilePath = path.join(process.cwd(), 'public', 'uploads', servant.medicalReport);
        await unlink(oldFilePath).catch(() => {});
      }
    }

    if (assignedByChildIds.length) {
      updateData.children = { set: assignedByChildIds.map((id) => ({ id })) };
    }

    const updatedServant = await prisma.servant.update({
      where: { id },
      data: updateData,
      include: {
        assignedRoom: true,
      },
    });
    return NextResponse.json(updatedServant);
  } catch (error) {
    console.error('Error updating servant:', error);
    return NextResponse.json({ error: 'Failed to update servant' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const servant = await prisma.servant.findUnique({ where: { id } });
    if (!servant) {
      return NextResponse.json({ error: 'Servant not found' }, { status: 404 });
    }

    // Delete medical report file if exists
    if (servant.medicalReport) {
      const filePath = path.join(process.cwd(), 'public', 'uploads', servant.medicalReport);
      await unlink(filePath).catch(() => {});
    }

    await prisma.servant.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting servant:', error);
    return NextResponse.json({ error: 'Failed to delete servant' }, { status: 500 });
  }
}
// app/api/servants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const servants = await prisma.servant.findMany({
      include: {
        assignedRoom: true,
      },
    });
    return NextResponse.json(servants);
  } catch (error) {
    console.error('Error fetching servants:', error);
    return NextResponse.json({ error: 'Failed to fetch servants' }, { status: 500 });
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const assignedRoomIdStr = formData.get('assignedRoomId') as string;
    const canTransferRoomsStr = formData.get('canTransferRooms') as string;

    const assignedRoomId = assignedRoomIdStr === 'none' ? null : (assignedRoomIdStr ? parseInt(assignedRoomIdStr) : null);
    const canTransferRooms = canTransferRoomsStr === 'true';

    let medicalReport: string | undefined;
    const medicalReportFile = formData.get('medicalReport') as File | null;
    if (medicalReportFile && medicalReportFile.size > 0) {
      medicalReport = await handleFileUpload(medicalReportFile);
    }

    const servant = await prisma.servant.create({
      data: {
        fullName,
        email,
        phone,
        medicalReport,
        assignedRoomId,
        canTransferRooms,
      },
      include: {
        assignedRoom: true,
      },
    });
    return NextResponse.json(servant, { status: 201 });
  } catch (error) {
    console.error('Error creating servant:', error);
    return NextResponse.json({ error: 'Failed to create servant' }, { status: 500 });
  }
}
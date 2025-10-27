// app/api/servants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const servants = await prisma.servant.findMany({
      include: {
        assignedRoom: {
          select: {
            id: true,
            name: true,
            ageRange: true
          }
        },
        children: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            gender: true,
            parentName: true,
            parentEmail: true,
            site: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(servants);
  } catch (error) {
    console.error('Error fetching servants:', error);
    return NextResponse.json({ error: 'Failed to fetch servants' }, { status: 500 });
  }
}

async function handleFileUpload(file: File) {
  // Validate file type
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed');
  }

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

    let medicalReport: string | undefined;
    const medicalReportFile = formData.get('medicalReport') as File | null;
    if (medicalReportFile && medicalReportFile.size > 0) {
      medicalReport = await handleFileUpload(medicalReportFile);
    }

    if (!fullName || !phone || !email) {
      return NextResponse.json({ error: 'Full name, email, and phone are required' }, { status: 400 });
    }

    if (!organizationType) {
      return NextResponse.json({ error: 'Organization type is required' }, { status: 400 });
    }

    // Validate organization type enum value
    if (!['INSA', 'AI', 'MINISTRY_OF_PEACE', 'FINANCE_SECURITY'].includes(organizationType)) {
      return NextResponse.json({ error: 'Invalid organization type value' }, { status: 400 });
    }

    // Check if email already exists
    const existingServant = await prisma.servant.findFirst({
      where: { email }
    });

    if (existingServant) {
      return NextResponse.json({ error: 'A caregiver with this email already exists' }, { status: 409 });
    }

    const servant = await prisma.servant.create({
      data: {
        fullName,
        email,
        phone,
        medicalReport,
        assignedRoomId,
        canTransferRooms,
        siteId: null, // TODO: Update to use actual site ID from database
        organizationType: organizationType as "INSA" | "AI" | "MINISTRY_OF_PEACE" | "FINANCE_SECURITY",
        ...(assignedByChildIds.length
          ? { children: { connect: assignedByChildIds.map((id) => ({ id })) } }
          : {}),
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
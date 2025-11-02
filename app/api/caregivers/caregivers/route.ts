// app/api/caregivers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = 'public/uploads';

// Define the organization type to match the Prisma schema
type OrganizationType = 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY';

export async function GET() {
  try {
    const caregivers = await prisma.caregiver.findMany({
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
    return NextResponse.json(caregivers);
  } catch (error) {
    console.error('Error fetching caregivers:', error);
    return NextResponse.json({ error: 'Failed to fetch caregivers' }, { status: 500 });
  }
}

async function handleFileUpload(file: File) {
  // Validate file type
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed');
  }

  // Define the upload directory
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${file.name}`;
  const filepath = join(uploadDir, filename);
  await writeFile(filepath, buffer);

  return filename;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fullName = (formData.get('fullName') as string || '').trim();
    const email = ((formData.get('email') as string) || '').trim() || null;
    const phone = (formData.get('phone') as string || '').trim();
    const assignedRoomId = formData.get('assignedRoomId') as string | null;
    const assignedByChildIds = formData.get('assignedByChildIds')?.toString().split(',').map(Number).filter(Boolean) || [];
    const medicalReport = formData.get('medicalReport') as File | null;
    const organizationType = formData.get('organizationType') as string;
    const assignedByChildIdsStr = formData.getAll('assignedByChildIds');

    const assignedRoomIdStr = assignedRoomId === 'none' ? null : (assignedRoomId ? parseInt(assignedRoomId) : null);
    const canTransferRoomsStr = formData.get('canTransferRooms') as string;
    const canTransferRooms = canTransferRoomsStr === 'true';

    let medicalReportName: string | undefined;
    if (medicalReport && medicalReport.size > 0) {
      medicalReportName = await handleFileUpload(medicalReport);
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate organization type enum value only if provided
    if (organizationType && !['INSA', 'AI', 'MINISTRY_OF_PEACE', 'FINANCE_SECURITY'].includes(organizationType)) {
      return NextResponse.json({ error: 'Invalid organization type value' }, { status: 400 });
    }

    // Check if email already exists (only if email is provided)
    if (email) {
      const existingCaregiver = await prisma.$queryRaw`
        SELECT id FROM "Caregiver" WHERE email = ${email} LIMIT 1
      ` as any[];
      
      if (existingCaregiver && existingCaregiver.length > 0) {
        return NextResponse.json({ error: 'A caregiver with this email already exists' }, { status: 409 });
      }
    }

    // Use raw query to insert caregiver to avoid Prisma client issues
    const caregiverData = {
      fullName: fullName || null,
      email,
      phone: phone || null,
      medicalReport: medicalReportName || null,
      assignedRoomId: assignedRoomIdStr ? parseInt(assignedRoomIdStr) : null,
      canTransferRooms,
      organizationType: organizationType || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert caregiver using raw query
    const caregiver = await prisma.$queryRaw`
      INSERT INTO "Caregiver" ("fullName", "email", "phone", "medicalReport", "assignedRoomId", "canTransferRooms", "organizationType", "createdAt", "updatedAt")
      VALUES (
        ${caregiverData.fullName},
        ${caregiverData.email},
        ${caregiverData.phone},
        ${caregiverData.medicalReport},
        ${caregiverData.assignedRoomId},
        ${caregiverData.canTransferRooms},
        ${caregiverData.organizationType ? caregiverData.organizationType : null}::"OrganizationType",
        ${caregiverData.createdAt},
        ${caregiverData.updatedAt}
      )
      RETURNING *
    ` as any;

    // Handle child relationships if any
    if (assignedByChildIds.length > 0) {
      await prisma.$executeRaw`
        UPDATE "Child"
        SET "caregiverId" = ${caregiver[0].id}
        WHERE id = ANY(${assignedByChildIds}::int[])
      `;
    }
    return NextResponse.json(caregiver, { status: 201 });
  } catch (error) {
    console.error('Error creating caregiver:', error);
    return NextResponse.json({ error: 'Failed to create caregiver' }, { status: 500 });
  }
}
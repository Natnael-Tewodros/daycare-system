import { NextResponse } from 'next/server';
// ... (keep the other imports like prisma, processFileUpload, and saveFile the same) ...
import { prisma } from '@/lib/prisma';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { OrganizationType } from '@prisma/client';

async function processFileUpload(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}-${file.name}`;
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  // Return filename; consumer can construct public URL as `/uploads/${filename}` if needed
  return filename;
}

// List children (used by dashboard children page)
export async function GET() {
  try {
    const children = await prisma.child.findMany({
      include: { organization: true },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = children.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      parentName: c.parentName,
      gender: c.gender,
      relationship: c.relationship,
      site: c.site,
      organization: c.organization?.name ?? '',
      dateOfBirth: c.dateOfBirth,
      createdAt: c.createdAt,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching children:', error);
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 });
  }
}

// Create a new child
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Debug: Log form data
    console.log('Form data received:', Object.fromEntries(formData.entries()));

    // Required fields with validation
    const parentName = (formData.get("parentName") as string)?.trim();
    const fullName = (formData.get("fullName") as string)?.trim();
    const relationship = formData.get("relationship") as string;
    const gender = formData.get("gender") as string;
    const dateOfBirthStr = formData.get("dateOfBirth") as string;
    const site = formData.get("site") as string;
    // Accept either organizationId (numeric) or organization (name)
    const organizationIdStr = (formData.get("organizationId") as string) || '';
    const organizationName = (formData.get("organization") as string) || '';

    // Validate required fields
    const missingFields = [];
    if (!parentName) missingFields.push('parentName');
    if (!fullName) missingFields.push('fullName');
    if (!relationship) missingFields.push('relationship');
    if (!gender) missingFields.push('gender');
    if (!dateOfBirthStr) missingFields.push('dateOfBirth');
    if (!site) missingFields.push('site');
    if (!organizationIdStr && !organizationName) missingFields.push('organizationId or organization');
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Parse and validate date
    const dateOfBirth = new Date(dateOfBirthStr);
    if (isNaN(dateOfBirth.getTime())) {
      throw new Error("Invalid date format. Please use YYYY-MM-DD");
    }

    // Parse IDs with validation
    let organizationId: number | null = null;
    if (organizationIdStr) {
      const parsedId = Number(organizationIdStr);
      if (isNaN(parsedId) || parsedId <= 0) {
        throw new Error("Invalid organization ID. Must be a positive number");
      }
      organizationId = parsedId;
    }

    // Optional fields with validation
    const servantId = formData.has("servantId") 
      ? Number(formData.get("servantId")) 
      : null;
    
    const roomId = formData.has("roomId")
      ? Number(formData.get("roomId"))
      : null;

    if ((servantId !== null && isNaN(servantId)) || 
        (roomId !== null && isNaN(roomId))) {
      throw new Error("Invalid ID format for servant or room");
    }

    const option = (formData.get("option") as string)?.trim() || "DEFAULT_OPTION";

    try {
      // Process file uploads in parallel with progress
      const [profilePic, childInfo, otherFilePath] = await Promise.allSettled([
        processFileUpload(formData.get("profilePic") as File | null),
        processFileUpload(formData.get("childInfoFile") as File | null),
        processFileUpload(formData.get("otherFile") as File | null)
      ]).then(results => 
        results.map(result => 
          result.status === 'fulfilled' ? result.value : null
        )
      );

      // Resolve organization by id or by name; create if missing by name
      let organization = null as null | { id: number };
      if (organizationId !== null) {
        organization = await prisma.organization.findUnique({
          where: { id: organizationId }
        });
      } else if (organizationName) {
        const foundByName = await prisma.organization.findFirst({
          where: { name: { equals: organizationName, mode: 'insensitive' } }
        });
        if (foundByName) {
          organization = { id: foundByName.id };
        } else {
          // Attempt to infer OrganizationType from provided name, fallback to INSA
          const possibleType = (OrganizationType as any)[organizationName as keyof typeof OrganizationType] as OrganizationType | undefined;
          const inferredType = possibleType ?? OrganizationType.INSA;
          const created = await prisma.organization.create({
            data: {
              name: organizationName,
              type: inferredType,
            },
          });
          organization = { id: created.id };
        }
      }
      
      if (!organization) {
        throw new Error(`Organization not found${organizationIdStr ? ` with ID ${organizationIdStr}` : organizationName ? ` with name "${organizationName}"` : ''}`);
      }

      // Create the child record
      const child = await prisma.$transaction(async (tx) => {
        const childData = {
          parentName,
          fullName,
          relationship,
          gender,
          dateOfBirth,
          site,
          organizationId: organization.id,
          servantId,
          roomId,
          option,
          profilePic: profilePic as string | null,
          childInfoFile: (childInfo || otherFilePath) as string | null,
        };

        return await tx.child.create({
          data: childData,
          include: {
            organization: true,
            servant: true,
            room: true
          }
        });
      });

      return NextResponse.json({ 
        success: true, 
        child: {
          ...child,
          dateOfBirth: child.dateOfBirth.toISOString(),
          createdAt: child.createdAt.toISOString(),
          updatedAt: child.updatedAt.toISOString()
        } 
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to create child: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error("Error in POST /api/children:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        ...(process.env.NODE_ENV === 'development' && {
          stack: (error as any).stack,
          details: error
        })
      }, 
      { status: 500 }
    );
  }
}

// ... (keep the rest of the code the same) ...
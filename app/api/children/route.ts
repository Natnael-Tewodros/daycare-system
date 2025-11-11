import { NextResponse } from 'next/server';
// ... (keep the other imports like prisma, processFileUpload, and saveFile the same) ...
import { prisma } from '@/lib/prisma';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { Gender, Relationship } from '@prisma/client';

// Function to calculate age in months
const calculateAgeInMonths = (dateOfBirth: string | Date): number => {
  const birthDate = new Date(dateOfBirth);
  const now = new Date();
  let ageInMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
  
  // If the current day is before the birth day, subtract one month
  if (now.getDate() < birthDate.getDate()) {
    ageInMonths--;
  }
  
  return ageInMonths;
};

// Function to automatically assign room based on age
const getRoomByAge = async (ageInMonths: number, organizationId: number) => {
  let roomName = '';
  let ageRange = '';
  
  if (ageInMonths >= 3 && ageInMonths <= 12) {
    // Room 1: 3 months - 1 year
    roomName = 'Room 1';
    ageRange = '3 months - 1 year';
  } else if (ageInMonths >= 13 && ageInMonths <= 24) {
    // Room 2: 1 year - 2 years
    roomName = 'Room 2';
    ageRange = '1 year - 2 years';
  } else if (ageInMonths >= 25 && ageInMonths <= 48) {
    // Room 3: 2 years - 4 years
    roomName = 'Room 3';
    ageRange = '2 years - 4 years';
  } else {
    // Child is too young (under 3 months) or too old (over 4 years)
    return null;
  }
  
  // Find or create room for this organization
  const room = await prisma.room.findFirst({
    where: {
      organizationId: organizationId,
      name: roomName
    }
  });
  
  if (room) {
    return room.id;
  }
  
  // Create room if it doesn't exist
  const newRoom = await prisma.room.create({
    data: {
      name: roomName,
      ageRange: ageRange,
      organizationId: organizationId
    }
  });
  
  return newRoom.id;
};

async function processFileUpload(file: File | null, fileType: 'profile' | 'document' = 'document'): Promise<string | null> {
  if (!file || file.size === 0) return null;

  // Validate file type based on the file type
  if (fileType === 'document' && file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed for documents');
  }
  if (fileType === 'profile' && !file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed for profile pictures');
  }

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
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentName = searchParams.get('parentName');
    const parentEmail = searchParams.get('parentEmail');
    const parentUsername = searchParams.get('parentUsername');
    const parentId = searchParams.get('parentId');


    // If parent username is provided, look up parent user first
    let parentUser = null;
    if (parentUsername) {
      parentUser = await prisma.user.findFirst({
        where: { username: { equals: parentUsername, mode: 'insensitive' } }
      });
      if (parentUser) {
      }
    }

    // Build where clause based on available filters
    let whereClause: any = {};
    if (parentName) {
      whereClause.parentName = { equals: parentName, mode: 'insensitive' };
    }
    if (parentEmail) {
      whereClause.parentEmail = { equals: parentEmail, mode: 'insensitive' };
    }
    if (parentId) {
      whereClause.parentId = parentId;
    }
    
    // If we found parent user by username, also search by parentId
    if (parentUser) {
      whereClause = {
        OR: [
          whereClause,
          { parentId: parentUser.id }
        ]
      };
    }


    // TODO: After adding approvalStatus field to database via migration
    // Filter children by approval status for non-admin users
    // const isAdmin = request.headers.get('user-role') === 'ADMIN';
    // const whereClauseWithApproval = {
    //   ...whereClause,
    //   ...(!isAdmin ? { approvalStatus: 'approved' } : {})
    // };

    const children = await prisma.child.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: { 
        organization: true,
        caregiver: true,
        room: true,
        site: true,
        parent: true, // Include parent user info
        attendances: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        reports: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });


    const mapped = children.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      parentName: c.parentName,
      parentEmail: c.parentEmail, // Add parentEmail field
      gender: c.gender,
      relationship: c.relationship,
      site: c.site?.name || 'Unassigned',
      organization: {
        name: c.organization?.name ?? '',
        id: c.organization?.id ?? 0
      },
      servant: c.caregiver ? {
        id: c.caregiver.id,
        fullName: c.caregiver.fullName
      } : null,
      room: c.room ? {
        id: c.room.id,
        name: c.room.name,
        ageRange: c.room.ageRange
      } : null,
      dateOfBirth: c.dateOfBirth,
      createdAt: c.createdAt,
      profilePic: c.profilePic
        ? (c.profilePic.startsWith('http') || c.profilePic.startsWith('/')
            ? c.profilePic
            : `/uploads/${c.profilePic}`)
        : null,
      childInfoFile: c.childInfoFile
        ? (c.childInfoFile.startsWith('http') || c.childInfoFile.startsWith('/')
            ? c.childInfoFile
            : `/uploads/${c.childInfoFile}`)
        : null,
      approvalStatus: (c as any).approvalStatus || 'active',
      activities: c.attendances.map(a => ({
        id: a.id,
        status: a.status,
        checkInTime: a.checkInTime,
        checkOutTime: a.checkOutTime,
        broughtBy: a.broughtBy,
        takenBy: a.takenBy,
        createdAt: a.createdAt
      })),
      reports: c.reports.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
        createdAt: r.createdAt
      }))
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
    const parentEmail = (formData.get("parentEmail") as string)?.trim();
    const parentUsername = (formData.get("parentUsername") as string)?.trim(); // NEW: Accept username
    const parentPassword = (formData.get("parentPassword") as string)?.trim();
    const fullName = (formData.get("fullName") as string)?.trim();
    const relationship = formData.get("relationship") as string;
    const gender = formData.get("gender") as string;
    const dateOfBirthStr = (formData.get("dateOfBirth") as string) || '';
    const site = formData.get("site") as string;
    // Accept either organizationId (numeric) or organization (name)
    const organizationIdStr = (formData.get("organizationId") as string) || '';
    const organizationName = (formData.get("organization") as string) || '';

    // Validate required fields
    const missingFields = [];
    if (!fullName) missingFields.push('fullName');
    if (!relationship) missingFields.push('relationship');
    if (!gender) missingFields.push('gender');
    if (!dateOfBirthStr) missingFields.push('dateOfBirth');
    if (!site) missingFields.push('site');
    if (!organizationIdStr && !organizationName) missingFields.push('organizationId or organization');
    
    // Parent email OR username is required
    if (!parentEmail && !parentUsername) {
      missingFields.push('parentEmail or parentUsername');
    }
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate that parent email or username exists in User table
    let parentUser = null;
    let finalParentEmail = parentEmail;
    let finalParentName = parentName;

    if (parentUsername) {
      // Look up by username
      try {
        parentUser = await prisma.user.findFirst({
          where: { username: { equals: parentUsername, mode: 'insensitive' } }
        });
      } catch (dbError) {
        console.error('Database error during username lookup:', dbError);
        return NextResponse.json(
          { error: "Database connection error. Please try again." },
          { status: 500 }
        );
      }
      
      if (!parentUser) {
        return NextResponse.json(
          { error: `Parent with username "${parentUsername}" does not exist. Please register as a parent first.` },
          { status: 400 }
        );
      }
      
      finalParentEmail = parentUser.email;
      console.log(`Parent found by username: ${parentUser.name} (${parentUsername})`);
    } else if (parentEmail) {
      // Look up by email
      try {
        parentUser = await prisma.user.findFirst({
          where: { email: { equals: parentEmail, mode: 'insensitive' } }
        });
      } catch (dbError) {
        console.error('Database error during email lookup:', dbError);
        return NextResponse.json(
          { error: "Database connection error. Please try again." },
          { status: 500 }
        );
      }
      
      if (!parentUser) {
        return NextResponse.json(
          { error: `Parent with email ${parentEmail} does not exist. Please register as a parent first.` },
          { status: 400 }
        );
      }
      
      console.log(`Parent found by email: ${parentUser.name} (${parentEmail})`);
    }

    // Use parent's actual name and email from User table
    if (parentUser) {
      finalParentName = parentUser.name;
      if (!finalParentEmail && parentUser.email) {
        finalParentEmail = parentUser.email;
      }
    }

    // Enforce: parent must have an approved enrollment request before registering children
    if (!finalParentEmail) {
      return NextResponse.json(
        { error: 'Unable to determine parent email for enrollment verification.' },
        { status: 400 }
      );
    }

    const approvedRequest = await prisma.enrollmentRequest.findFirst({
      where: {
        email: { equals: finalParentEmail, mode: 'insensitive' },
        status: 'approved'
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (!approvedRequest) {
      return NextResponse.json(
        { error: 'Parent must have an approved enrollment request before child registration.' },
        { status: 403 }
      );
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
    const caregiverId = formData.has("servantId") || formData.has("caregiverId")
      ? Number(formData.get("servantId") || formData.get("caregiverId")) 
      : null;
    
    const roomId = formData.has("roomId")
      ? Number(formData.get("roomId"))
      : null;

    if ((caregiverId !== null && isNaN(caregiverId)) || 
        (roomId !== null && isNaN(roomId))) {
      throw new Error("Invalid ID format for caregiver or room");
    }

    const option = (formData.get("option") as string)?.trim() || "DEFAULT_OPTION";

    try {
      // Process file uploads in parallel with progress
      const [profilePic, childInfo, otherFilePath] = await Promise.allSettled([
        processFileUpload(formData.get("profilePic") as File | null, 'profile'),
        processFileUpload(formData.get("childInfoFile") as File | null, 'document'),
        processFileUpload(formData.get("otherFile") as File | null, 'document')
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
          // Create new organization if it doesn't exist
          const created = await prisma.organization.create({
            data: {
              name: organizationName,
            },
          });
          organization = { id: created.id };
        }
      }
      
      if (!organization) {
        throw new Error(`Organization not found${organizationIdStr ? ` with ID ${organizationIdStr}` : organizationName ? ` with name "${organizationName}"` : ''}`);
      }

      // Resolve site by provided code/name and set siteId
      let resolvedSiteId: number | null = null;
      if (site) {
        const siteName = site.toUpperCase() === 'HEADOFFICE' ? 'Head Office'
          : site.toUpperCase() === 'OPERATION' ? 'Operation Center'
          : site.toUpperCase() === 'BRANCH1' ? 'Branch 1'
          : site.toUpperCase() === 'BRANCH2' ? 'Branch 2'
          : site;
        let foundSite = await prisma.site.findFirst({
          where: { name: { equals: siteName, mode: 'insensitive' } },
        });
        if (!foundSite) {
          foundSite = await prisma.site.create({
            data: { name: siteName }
          });
        }
        resolvedSiteId = foundSite.id;
      }

      // Strong duplicate check:
      // 1) Block same full name within the same organization (case-insensitive)
      // 2) Additionally, block same full name with the same parent (by email/id)
      const existingSameNameInOrg = await prisma.child.findFirst({
        where: {
          organizationId: organization.id,
          fullName: { equals: fullName, mode: 'insensitive' },
        }
      });
      if (existingSameNameInOrg) {
        return NextResponse.json(
          { error: 'A child with this name already exists in this organization.' },
          { status: 409 }
        );
      }

      const existingSameNameWithParent = await prisma.child.findFirst({
        where: {
          fullName: { equals: fullName, mode: 'insensitive' },
          OR: [
            { parentEmail: finalParentEmail ? { equals: finalParentEmail, mode: 'insensitive' } : undefined },
            { parentId: parentUser?.id || undefined }
          ].filter(Boolean) as any
        }
      });
      if (existingSameNameWithParent) {
        return NextResponse.json(
          { error: 'This child is already registered under the same parent.' },
          { status: 409 }
        );
      }

      // Calculate age and automatically assign room if not already provided
      let finalRoomId = roomId;
      if (!finalRoomId) {
        const ageInMonths = calculateAgeInMonths(dateOfBirth);
        console.log(`Calculated age: ${ageInMonths} months for child`);
        
        // Automatically assign room based on age
        finalRoomId = await getRoomByAge(ageInMonths, organization.id);
        console.log(`Assigned to room: ${finalRoomId}`);
      }

      // Create the child record (no interactive transaction needed)
      const childData: any = {
        parentName: finalParentName,
        parentEmail: finalParentEmail || null,
        parentPassword: parentPassword || null,
        fullName,
        relationship: relationship as Relationship,
        gender: gender as Gender,
        dateOfBirth,
        siteId: resolvedSiteId,
        organizationId: organization.id,
        caregiverId,
        roomId: finalRoomId,
        option,
        profilePic: profilePic as string | null,
        childInfoFile: (childInfo || otherFilePath) as string | null,
        parentId: parentUser?.id || null,
      };

      const child = await prisma.child.create({
        data: childData,
        include: {
          organization: true,
          caregiver: true,
          room: true,
          parent: true,
        },
      });

      return NextResponse.json({ 
        success: true,
        message: 'Child registered successfully! Pending admin approval.',
        requiresApproval: true,
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
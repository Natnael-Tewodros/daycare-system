// app/api/organization/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

async function handleLogoUpload(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  // Validate file type - only images
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed for organization logos');
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}-${file.name}`;
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  return `/uploads/${filename}`;
}

export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        children: {
          include: {
            servant: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        rooms: {
          include: {
            servants: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform the data to include counts
    const organizationsWithCounts = organizations.map(org => {
      // Get all unique servants from children and rooms
      const servantsFromChildren = org.children
        .filter(child => child.servant)
        .map(child => child.servant!);
      
      const servantsFromRooms = org.rooms
        .flatMap(room => room.servants);
      
      const allServants = [...servantsFromChildren, ...servantsFromRooms];
      const uniqueServants = Array.from(
        new Map(allServants.map(s => [s.id, s])).values()
      );

      return {
        id: org.id,
        name: org.name,
        logo: org.logo,
        website: org.website,
        address: org.address,
        phone: org.phone,
        email: org.email,
        childrenCount: org.children.length,
        servantsCount: uniqueServants.length,
        children: org.children.map(child => ({
          id: child.id,
          fullName: child.fullName,
          servant: child.servant
        })),
        servants: uniqueServants,
        rooms: org.rooms.map(room => ({
          id: room.id,
          name: room.name,
          ageRange: room.ageRange,
          servantsCount: room.servants.length
        })),
        createdAt: org.createdAt.toISOString()
      };
    });

    return NextResponse.json(organizationsWithCounts);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = (formData.get('name') as string)?.trim();
    const website = (formData.get('website') as string)?.trim() || null;
    const address = (formData.get('address') as string)?.trim() || null;
    const phone = (formData.get('phone') as string)?.trim() || null;
    const email = (formData.get('email') as string)?.trim() || null;
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if organization with same name already exists
    const existingOrg = await prisma.organization.findFirst({
      where: { 
        name: { equals: name, mode: 'insensitive' }
      }
    });

    if (existingOrg) {
      return NextResponse.json({ error: 'Organization with this name already exists' }, { status: 409 });
    }

    // Handle logo upload
    let logoPath: string | null = null;
    const logoFile = formData.get('logo') as File | null;
    if (logoFile && logoFile.size > 0) {
      logoPath = await handleLogoUpload(logoFile);
    }

    const organization = await prisma.organization.create({
      data: {
        name: name,
        logo: logoPath,
        website: website,
        address: address,
        phone: phone,
        email: email
      },
      include: {
        children: {
          include: {
            servant: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        rooms: {
          include: {
            servants: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    // Get all unique servants from children and rooms
    const servantsFromChildren = organization.children
      .filter(child => child.servant)
      .map(child => child.servant!);
    
    const servantsFromRooms = organization.rooms
      .flatMap(room => room.servants);
    
    const allServants = [...servantsFromChildren, ...servantsFromRooms];
    const uniqueServants = Array.from(
      new Map(allServants.map(s => [s.id, s])).values()
    );

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      logo: organization.logo,
      website: organization.website,
      address: organization.address,
      phone: organization.phone,
      email: organization.email,
      childrenCount: organization.children.length,
      servantsCount: uniqueServants.length,
      children: organization.children.map(child => ({
        id: child.id,
        fullName: child.fullName,
        servant: child.servant
      })),
      servants: uniqueServants,
      rooms: organization.rooms.map(room => ({
        id: room.id,
        name: room.name,
        ageRange: room.ageRange,
        servantsCount: room.servants.length
      })),
      createdAt: organization.createdAt.toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }
}
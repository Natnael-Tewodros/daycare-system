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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = parseInt(params.id);
    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const website = (formData.get('website') as string)?.trim() || null;
    const address = (formData.get('address') as string)?.trim() || null;
    const phone = (formData.get('phone') as string)?.trim() || null;
    const email = (formData.get('email') as string)?.trim() || null;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if another organization with same name exists (excluding current one)
    const duplicateOrg = await prisma.organization.findFirst({
      where: { 
        name: { equals: name, mode: 'insensitive' },
        id: { not: organizationId }
      }
    });

    if (duplicateOrg) {
      return NextResponse.json({ error: 'Organization with this name already exists' }, { status: 409 });
    }

    // Handle logo upload if provided
    const logoFile = formData.get('logo') as File | null;
    let logoPath = existingOrg.logo; // Keep existing logo by default
    if (logoFile && logoFile.size > 0) {
      logoPath = await handleLogoUpload(logoFile);
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
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
    const servantsFromChildren = updatedOrganization.children
      .filter(child => child.servant)
      .map(child => child.servant!);
    
    const servantsFromRooms = updatedOrganization.rooms
      .flatMap(room => room.servants);
    
    const allServants = [...servantsFromChildren, ...servantsFromRooms];
    const uniqueServants = Array.from(
      new Map(allServants.map(s => [s.id, s])).values()
    );

    return NextResponse.json({
      id: updatedOrganization.id,
      name: updatedOrganization.name,
      logo: updatedOrganization.logo,
      website: updatedOrganization.website,
      address: updatedOrganization.address,
      phone: updatedOrganization.phone,
      email: updatedOrganization.email,
      childrenCount: updatedOrganization.children.length,
      servantsCount: uniqueServants.length,
      children: updatedOrganization.children.map(child => ({
        id: child.id,
        fullName: child.fullName,
        servant: child.servant
      })),
      servants: uniqueServants,
      rooms: updatedOrganization.rooms.map(room => ({
        id: room.id,
        name: room.name,
        ageRange: room.ageRange,
        servantsCount: room.servants.length
      })),
      createdAt: updatedOrganization.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = parseInt(params.id);

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        children: true,
        rooms: true
      }
    });

    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if organization has children or rooms
    if (existingOrg.children.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete organization with enrolled children. Please reassign children first.' 
      }, { status: 400 });
    }

    if (existingOrg.rooms.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete organization with assigned rooms. Please reassign rooms first.' 
      }, { status: 400 });
    }

    await prisma.organization.delete({
      where: { id: organizationId }
    });

    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
  }
}

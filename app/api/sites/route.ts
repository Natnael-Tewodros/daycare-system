import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from "path";
import { mkdir, writeFile } from "fs/promises";

async function handleLogoUpload(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  // Validate file type - only images
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed for site logos');
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

// Get all available sites with their data
export async function GET() {
  try {
    // Get all sites from database
    const sites = await prisma.site.findMany({
      where: { isActive: true },
      include: {
        children: {
          select: { id: true }
        },
        servants: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Get all organizations for total count
    const organizations = await prisma.organization.findMany({
      select: { id: true }
    });

    // Get all rooms for total count
    const rooms = await prisma.room.findMany({
      select: { id: true }
    });

    // Transform sites data
    const sitesData = sites.map(site => ({
      id: site.id,
      name: site.name,
      description: site.description || '',
      logo: site.logo || '',
      address: site.address || '',
      phone: site.phone || '',
      email: site.email || '',
      website: site.website || '',
      totalChildren: site.children.length,
      totalServants: site.servants.length,
      totalOrganizations: organizations.length, // All organizations are available to all sites
      totalRooms: rooms.length, // All rooms are available to all sites
      createdAt: site.createdAt.toISOString(),
      updatedAt: site.updatedAt.toISOString()
    }));

    return NextResponse.json(sitesData);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }
}

// Create a new site
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const website = (formData.get('website') as string)?.trim() || null;
    const address = (formData.get('address') as string)?.trim() || null;
    const phone = (formData.get('phone') as string)?.trim() || null;
    const email = (formData.get('email') as string)?.trim() || null;

    if (!name) {
      return NextResponse.json({ error: 'Site name is required' }, { status: 400 });
    }

    // Handle logo upload
    let logoPath: string | null = null;
    const logoFile = formData.get('logo') as File | null;
    if (logoFile && logoFile.size > 0) {
      logoPath = await handleLogoUpload(logoFile);
    }

    const site = await prisma.site.create({
      data: {
        name,
        description,
        logo: logoPath,
        website,
        address,
        phone,
        email
      }
    });

    return NextResponse.json({ 
      success: true, 
      site: {
        id: site.id,
        name: site.name,
        description: site.description,
        logo: site.logo,
        address: site.address,
        phone: site.phone,
        email: site.email,
        website: site.website,
        createdAt: site.createdAt.toISOString(),
        updatedAt: site.updatedAt.toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 });
  }
}

// Update a site
export async function PUT(req: Request) {
  try {
    const formData = await req.formData();
    const idStr = formData.get('id') as string;
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const website = (formData.get('website') as string)?.trim() || null;
    const address = (formData.get('address') as string)?.trim() || null;
    const phone = (formData.get('phone') as string)?.trim() || null;
    const email = (formData.get('email') as string)?.trim() || null;

    if (!idStr || !name) {
      return NextResponse.json({ error: 'Site ID and name are required' }, { status: 400 });
    }

    const id = parseInt(idStr);

    // Check if site exists
    const existingSite = await prisma.site.findUnique({
      where: { id }
    });

    if (!existingSite) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Handle logo upload if provided
    const logoFile = formData.get('logo') as File | null;
    let logoPath = existingSite.logo; // Keep existing logo by default
    if (logoFile && logoFile.size > 0) {
      logoPath = await handleLogoUpload(logoFile);
    }

    const site = await prisma.site.update({
      where: { id },
      data: {
        name,
        description,
        logo: logoPath,
        website,
        address,
        phone,
        email
      }
    });

    return NextResponse.json({ 
      success: true, 
      site: {
        id: site.id,
        name: site.name,
        description: site.description,
        logo: site.logo,
        address: site.address,
        phone: site.phone,
        email: site.email,
        website: site.website,
        createdAt: site.createdAt.toISOString(),
        updatedAt: site.updatedAt.toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating site:', error);
    return NextResponse.json({ error: 'Failed to update site' }, { status: 500 });
  }
}

// Delete a site
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Soft delete by setting isActive to false
    await prisma.site.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Site deleted successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting site:', error);
    return NextResponse.json({ error: 'Failed to delete site' }, { status: 500 });
  }
}

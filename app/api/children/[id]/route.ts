import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    const child = await prisma.child.findUnique({
      where: { id },
      include: {
        organization: true,
        caregiver: true,
        room: true,
      },
    });

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...child,
      dateOfBirth: child.dateOfBirth,
      createdAt: child.createdAt,
      updatedAt: child.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching child:', error);
    return NextResponse.json({ error: 'Failed to fetch child' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const formData = await request.formData();
    const fullName = formData.get('fullName') as string;
    const relationship = formData.get('relationship') as string;
    const gender = formData.get('gender') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string;
    const site = formData.get('site') as string;
    const organization = formData.get('organization') as string;

    // Validate required fields
    if (!fullName || !relationship || !gender || !dateOfBirth || !site || !organization) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 });
    }

    // Handle file uploads
    const profilePic = formData.get('profilePic') as File | null;
    const childInfoFile = formData.get('childInfoFile') as File | null;
    const otherFile = formData.get('otherFile') as File | null;

    let profilePicPath = null;
    let childInfoFilePath = null;
    let otherFilePath = null;

    if (profilePic && profilePic.size > 0) {
      const bytes = await profilePic.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${profilePic.name}`;
      const path = join(process.cwd(), 'public/uploads', filename);
      await writeFile(path, buffer);
      profilePicPath = filename;
    }

    if (childInfoFile && childInfoFile.size > 0) {
      const bytes = await childInfoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${childInfoFile.name}`;
      const path = join(process.cwd(), 'public/uploads', filename);
      await writeFile(path, buffer);
      childInfoFilePath = filename;
    }

    if (otherFile && otherFile.size > 0) {
      const bytes = await otherFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${otherFile.name}`;
      const path = join(process.cwd(), 'public/uploads', filename);
      await writeFile(path, buffer);
      otherFilePath = filename;
    }

    // Find or create organization
    let organizationRecord = await prisma.organization.findFirst({
      where: { name: organization }
    });

    if (!organizationRecord) {
      organizationRecord = await prisma.organization.create({
        data: { name: organization }
      });
    }

    // Resolve Site by provided code/name and set siteId
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
        foundSite = await prisma.site.create({ data: { name: siteName } });
      }
      resolvedSiteId = foundSite.id;
    }

    // Update child data
    const updateData: any = {
      fullName,
      relationship,
      gender,
      dateOfBirth: new Date(dateOfBirth),
      siteId: resolvedSiteId,
      organizationId: organizationRecord.id,
    };

    // Only update file paths if new files were uploaded
    if (profilePicPath) updateData.profilePic = profilePicPath;
    if (childInfoFilePath) updateData.childInfoFile = childInfoFilePath;
    if (otherFilePath) updateData.otherFile = otherFilePath;

    const updatedChild = await prisma.child.update({
      where: { id },
      data: updateData,
      include: {
        organization: true,
        caregiver: true,
        room: true,
        site: true,
      },
    });

    return NextResponse.json({
      success: true,
      child: updatedChild,
      message: 'Child information updated successfully'
    });

  } catch (error) {
    console.error('Error updating child:', error);
    return NextResponse.json({ error: 'Failed to update child' }, { status: 500 });
  }
}



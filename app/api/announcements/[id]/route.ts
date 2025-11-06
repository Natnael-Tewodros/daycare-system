import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';

// Get single announcement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = Number.parseInt(id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: 'Invalid announcement id' }, { status: 400 });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: idNum }
    });

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement' }, { status: 500 });
  }
}

// Update announcement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = Number.parseInt(id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: 'Invalid announcement id' }, { status: 400 });
    }
    const contentType = request.headers.get('content-type') || '';
    let title: string | undefined;
    let content: string | undefined;
    let type: string | undefined;
    let isActive: boolean | undefined;
    let visibilityDays: number | null | undefined;
    let attachmentPaths: string[] | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      title = (formData.get('title') as string) ?? undefined;
      content = (formData.get('content') as string) ?? undefined;
      type = (formData.get('type') as string) ?? undefined;
      const activeStr = formData.get('isActive') as string | null;
      isActive = activeStr != null ? activeStr === 'true' : undefined;
      const vis = formData.get('visibilityDays') as string | null;
      visibilityDays = vis ? Number.parseInt(vis, 10) : null;

      const files = formData.getAll('attachments') as File[];
      if (files && files.length > 0) {
        attachmentPaths = [];
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });
        for (const file of files) {
          if (!file || file.size === 0) continue;
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const filename = `${Date.now()}-${file.name}`;
          const filepath = join(uploadDir, filename);
          await writeFile(filepath, buffer);
          attachmentPaths.push(`/uploads/${filename}`);
        }
      }
    } else {
      const body = await request.json();
      title = body.title;
      content = body.content;
      type = body.type;
      isActive = body.isActive;
      visibilityDays = body.visibilityDays ?? null;
      attachmentPaths = Array.isArray(body.attachments) ? body.attachments : undefined;
    }

    const announcement = await prisma.announcement.update({
      where: { id: idNum },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(visibilityDays !== undefined ? { visibilityDays } : {}),
        ...(attachmentPaths !== undefined ? { attachments: attachmentPaths } : {})
      }
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}

// Delete announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idNum = Number.parseInt(id, 10);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: 'Invalid announcement id' }, { status: 400 });
    }

    await prisma.announcement.delete({
      where: { id: idNum }
    });

    return NextResponse.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
  }
}


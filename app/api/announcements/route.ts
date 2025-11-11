import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';

async function deleteExpiredAnnouncements(): Promise<number> {
  const allWithExpiry = await prisma.announcement.findMany({
    where: { visibilityDays: { not: null } },
    select: { id: true, createdAt: true, visibilityDays: true }
  });
  const now = Date.now();
  const expiredIds = allWithExpiry
    .filter(a => {
      const days = a.visibilityDays as number;
      const ageDays = Math.floor((now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return ageDays > days;
    })
    .map(a => a.id);
  if (expiredIds.length === 0) return 0;
  const result = await prisma.announcement.deleteMany({ where: { id: { in: expiredIds } } });
  return result.count;
}

// Get all active announcements (public)
export async function GET() {
  try {
    // Cleanup expired announcements opportunistically
    deleteExpiredAnnouncements().catch(() => {});
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    // Filter announcements based on visibility days
    const now = new Date();
    const filteredAnnouncements = announcements.filter(announcement => {
      if (!announcement.visibilityDays) return true; // Permanent
      
      const daysSinceCreation = Math.floor(
        (now.getTime() - new Date(announcement.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return daysSinceCreation <= announcement.visibilityDays;
    });

    return NextResponse.json(filteredAnnouncements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

// Create new announcement (admin only)
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let title: string;
    let content: string;
    let type: string | undefined;
    let visibilityDays: number | null | undefined;
    let attachmentPaths: string[] = [];
    let isActive: boolean | undefined;

    if (contentType.toLowerCase().includes('multipart/form-data')) {
      const formData = await request.formData();
      title = (formData.get('title') as string) || '';
      content = (formData.get('content') as string) || '';
      type = (formData.get('type') as string) || 'GENERAL';
      const vis = formData.get('visibilityDays') as string | null;
      visibilityDays = vis ? Number.parseInt(vis, 10) : null;
      const activeStr = formData.get('isActive') as string | null;
      isActive = activeStr != null ? activeStr === 'true' : undefined;

      const files = formData.getAll('attachments') as File[];
      if (files && files.length > 0) {
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
    } else if (contentType.toLowerCase().includes('application/json')) {
      const body = await request.json();
      title = body.title;
      content = body.content;
      type = body.type || 'GENERAL';
      visibilityDays = typeof body.visibilityDays === 'number' ? body.visibilityDays : (body.visibilityDays == null ? null : Number.parseInt(String(body.visibilityDays), 10) || null);
      attachmentPaths = Array.isArray(body.attachments) ? body.attachments.filter((x: any) => typeof x === 'string') : [];
      if (typeof body.isActive === 'boolean') {
        isActive = body.isActive;
      }
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
    }

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Normalize type to enum values
    const allowedTypes = ['GENERAL', 'IMPORTANT', 'EVENT'] as const;
    const normalizedType = String(type || 'GENERAL').toUpperCase();
    const finalType = (allowedTypes as readonly string[]).includes(normalizedType) ? normalizedType : 'GENERAL';
    // Normalize visibilityDays
    const finalVisibility = typeof visibilityDays === 'number' && !Number.isNaN(visibilityDays) ? visibilityDays : null;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: finalType as any,
        visibilityDays: finalVisibility,
        attachments: attachmentPaths,
        isActive: typeof isActive === 'boolean' ? isActive : true
      }
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const userIdHeader = request.headers.get('x-user-id');
    let userId = userIdHeader || null;
    if (!userId) {
      const cookieUserId = request.cookies.get('userId')?.value;
      userId = cookieUserId || null;
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('profileImage') as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: filename },
      select: { id: true, profileImage: true },
    });

    return NextResponse.json({ success: true, profileImage: updated.profileImage });
  } catch (e) {
    console.error('Upload profile image error:', e);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}



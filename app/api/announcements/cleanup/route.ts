import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
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

    if (expiredIds.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    const result = await prisma.announcement.deleteMany({ where: { id: { in: expiredIds } } });
    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('Error cleaning up announcements:', error);
    return NextResponse.json({ error: 'Failed to cleanup announcements' }, { status: 500 });
  }
}



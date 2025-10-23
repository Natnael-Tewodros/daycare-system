import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get count of active announcements
export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      select: { createdAt: true, visibilityDays: true }
    });

    // Filter announcements based on visibility days
    const now = new Date();
    const activeAnnouncements = announcements.filter(announcement => {
      if (!announcement.visibilityDays) return true; // Permanent
      
      const daysSinceCreation = Math.floor(
        (now.getTime() - new Date(announcement.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return daysSinceCreation <= announcement.visibilityDays;
    });

    return NextResponse.json({ count: activeAnnouncements.length });
  } catch (error) {
    console.error('Error fetching announcement count:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement count' }, { status: 500 });
  }
}

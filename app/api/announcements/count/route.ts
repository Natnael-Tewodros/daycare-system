import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get count of active announcements that haven't been viewed
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');

    // Get all active announcements
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      select: { 
        id: true,
        createdAt: true, 
        visibilityDays: true
      }
    });

    // Filter announcements based on visibility days
    const now = new Date();
    const visibleAnnouncements = announcements.filter(announcement => {
      if (!announcement.visibilityDays) return true; // Permanent
      
      const daysSinceCreation = Math.floor(
        (now.getTime() - new Date(announcement.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return daysSinceCreation <= announcement.visibilityDays;
    });

    // If no user identification, return count of all visible announcements
    if (!userId && !userEmail) {
      return NextResponse.json({ count: visibleAnnouncements.length });
    }

    // Check which announcements have been viewed by this user
    const announcementIds = visibleAnnouncements.map(a => a.id);
    
    // Build the views where condition for this user
    const orConditions = [];
    if (userId) orConditions.push({ userId });
    if (userEmail) orConditions.push({ userEmail });

    const viewedAnnouncements = await prisma.announcementView.findMany({
      where: {
        announcementId: { in: announcementIds },
        OR: orConditions
      },
      select: { announcementId: true }
    });

    const viewedAnnouncementIds = new Set(viewedAnnouncements.map(v => v.announcementId));
    const unviewedCount = visibleAnnouncements.filter(a => !viewedAnnouncementIds.has(a.id)).length;

    return NextResponse.json({ count: unviewedCount });
  } catch (error) {
    console.error('Error fetching announcement count:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement count' }, { status: 500 });
  }
}

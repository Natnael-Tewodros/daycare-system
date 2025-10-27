import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get announcements with read status for a specific user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');

    // Get all active announcements
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
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

    // If no user identification, return all visible announcements without read status
    if (!userId && !userEmail) {
      return NextResponse.json(visibleAnnouncements.map(announcement => ({
        ...announcement,
        isRead: false
      })));
    }

    // Get read status for this user
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

    // Return announcements with read status
    const announcementsWithStatus = visibleAnnouncements.map(announcement => ({
      ...announcement,
      isRead: viewedAnnouncementIds.has(announcement.id)
    }));

    return NextResponse.json(announcementsWithStatus);
  } catch (error) {
    console.error('Error fetching announcements with status:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

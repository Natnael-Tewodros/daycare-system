import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all active announcements (public)
export async function GET() {
  try {
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
    const { title, content, type, visibilityDays } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: type || 'GENERAL',
        visibilityDays: visibilityDays || null
      }
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}


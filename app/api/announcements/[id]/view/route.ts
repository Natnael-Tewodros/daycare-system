import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mark an announcement as viewed
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { userId, userEmail } = await request.json();

    const announcementId = parseInt(id);
    if (isNaN(announcementId)) {
      return NextResponse.json(
        { error: 'Invalid announcement ID' },
        { status: 400 }
      );
    }

    // Check if announcement exists
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId }
    });

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Check if already viewed
    let existingViewWhereCondition: any = { announcementId };
    if (userId || userEmail) {
      const orConditions = [];
      if (userId) orConditions.push({ userId });
      if (userEmail) orConditions.push({ userEmail });
      existingViewWhereCondition = { 
        announcementId,
        OR: orConditions 
      };
    }

    const existingView = await prisma.announcementView.findFirst({
      where: existingViewWhereCondition
    });

    if (existingView) {
      return NextResponse.json({
        success: true,
        message: 'Announcement already marked as viewed'
      });
    }

    // Create view record
    await prisma.announcementView.create({
      data: {
        announcementId,
        userId: userId || null,
        userEmail: userEmail || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement marked as viewed'
    });

  } catch (error) {
    console.error('Error marking announcement as viewed:', error);
    return NextResponse.json(
      { error: 'Failed to mark announcement as viewed' },
      { status: 500 }
    );
  }
}

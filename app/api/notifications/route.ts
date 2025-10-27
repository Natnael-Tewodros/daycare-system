import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET notifications for a specific parent by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentEmail = searchParams.get('parentEmail');

    if (!parentEmail) {
      return NextResponse.json({ error: 'Parent email is required' }, { status: 400 });
    }

    // Get all notifications for this parent
    const notifications = await prisma.notification.findMany({
      where: {
        parentEmail: parentEmail,
      },
      include: {
        activity: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        parentEmail: parentEmail,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      totalCount: notifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH to mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      notification: updatedNotification,
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// DELETE to remove a notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}


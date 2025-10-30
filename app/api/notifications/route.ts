import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch notifications for a parent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentEmail = searchParams.get("parentEmail");

    if (!parentEmail) {
      return NextResponse.json({ error: "Parent email is required" }, { status: 400 });
    }

    // Fetch notifications, including related activity (if any)
    const notifications = await prisma.notification.findMany({
      where: { parentEmail },
      include: { activity: true },
      orderBy: { createdAt: "desc" },
    });

    // Unread count
    const unreadCount = await prisma.notification.count({
      where: { parentEmail, isRead: false },
    });

    // Map for compatibility with frontend
    const formatted = notifications.map((n) => ({
      id: n.id,
      parentEmail: n.parentEmail,
      isRead: n.isRead,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      activityId: n.activityId,
      // 👇 if it's an activity, use its data; else fall back to title/message
      activity: n.activity
        ? {
            id: n.activity.id,
            subject: n.activity.subject,
            description: n.activity.description,
            attachments: n.activity.attachments,
            createdAt: n.activity.createdAt,
          }
        : {
            id: null,
            subject: n.title || "Notification",
            description: n.message || "",
            attachments: [],
            createdAt: n.createdAt,
          },
    }));

    return NextResponse.json({
      notifications: formatted,
      unreadCount,
      totalCount: formatted.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// PATCH: Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

// DELETE: Remove a notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}

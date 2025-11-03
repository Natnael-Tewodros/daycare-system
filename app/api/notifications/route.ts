import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch notifications for a parent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentEmail = searchParams.get("parentEmail");
    const idParam = searchParams.get("id");
    const isReadParam = searchParams.get("isRead");

    const id = idParam ? parseInt(idParam, 10) : undefined;
    const isRead =
      isReadParam === null
        ? undefined
        : isReadParam.toLowerCase() === "true"
        ? true
        : isReadParam.toLowerCase() === "false"
        ? false
        : undefined;

    // Build flexible filter
    const where: any = {};
    if (typeof id === "number" && !Number.isNaN(id)) where.id = id;
    if (parentEmail) where.parentEmail = parentEmail;
    if (typeof isRead === "boolean") where.isRead = isRead;

    // Fetch notifications, including related activity (if any)
    const notifications = await prisma.notification.findMany({
      where,
      include: { activity: true },
      orderBy: { createdAt: "desc" },
    });

    // Unread count for the same scope
    const unreadCount = await prisma.notification.count({
      where: { ...where, isRead: false },
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

    if (id === undefined || id === null) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (Number.isNaN(numericId)) {
      return NextResponse.json({ error: "Notification ID must be a number" }, { status: 400 });
    }

    const updated = await prisma.notification.update({
      where: { id: numericId },
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

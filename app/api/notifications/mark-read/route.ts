import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { notificationIds } = await request.json();

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: "notificationIds array is required" }, { status: 400 });
    }

    const ids: number[] = notificationIds
      .map((id: unknown) => (typeof id === 'string' ? parseInt(id, 10) : id))
      .filter((n: unknown) => typeof n === 'number' && !Number.isNaN(n)) as number[];

    if (ids.length === 0) {
      return NextResponse.json({ error: "No valid numeric IDs provided" }, { status: 400 });
    }

    const result = await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}



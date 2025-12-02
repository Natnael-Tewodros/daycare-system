import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";

// --- GET: Fetch activities ---
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentEmail = searchParams.get("parentEmail");
    const parentId = searchParams.get("parentId");
    const senderType = searchParams.get("senderType"); // "admin" or "parent"
    const recipientEmail = searchParams.get("recipientEmail");
    const isReadParam = searchParams.get("isRead");
    const isRead =
      isReadParam === null
        ? undefined
        : isReadParam.toLowerCase() === "true"
        ? true
        : isReadParam.toLowerCase() === "false"
        ? false
        : undefined;

    let filter: any = {};

    // Initialize filter conditions
    const filterConditions = [];

    // If parentId is provided, add it to the filter
    if (parentId) {
      filterConditions.push({ parentId });
    }

    // If parentEmail is provided, add it to the filter
    if (parentEmail) {
      filterConditions.push(
        { parentEmail },
        { recipients: { has: parentEmail } }
      );
    }

    // If we have any filter conditions, combine them with OR
    if (filterConditions.length > 0) {
      filter.OR = filterConditions;
    }

    // Filter by sender type if provided
    if (senderType) {
      filter.senderType = senderType;
    } else if (parentId || parentEmail) {
      // If parent is specified but no senderType, default to parent
      filter.senderType = "parent";
    }

    // Filter activities by recipient notification state if provided
    if (recipientEmail) {
      filter.notifications = {
        some: {
          parentEmail: recipientEmail,
          ...(isRead !== undefined ? { isRead } : {}),
        },
      };
    }

    const activities = await prisma.activity.findMany({
      where: filter,
      include: { notifications: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    // Prisma returns code 'P1001' when it cannot reach the database server
    if (error && (error as any).code === "P1001") {
      const msg = (error as any).message || "Cannot reach database server";
      return NextResponse.json(
        { error: `Database connection error: ${msg}` },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

// --- POST: Create a new activity ---
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const subject = formData.get("subject") as string;
    const description = formData.get("description") as string;
    const recipientsJson = formData.get("recipients") as string;
    const attachments = formData.getAll("attachments") as File[];

    if (!subject)
      return NextResponse.json({ error: "Subject required" }, { status: 400 });

    const recipients = JSON.parse(recipientsJson || "[]");
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "Select at least one recipient" },
        { status: 400 }
      );
    }

    // Upload attachments
    const attachmentPaths: string[] = [];
    for (const file of attachments) {
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}-${file.name}`;
        const path = join(process.cwd(), "public/uploads", filename);
        await writeFile(path, buffer);
        attachmentPaths.push(`/uploads/${filename}`);
      }
    }

    // Get parent information from headers
    const parentEmail = request.headers.get("x-parent-email");
    const parentId = request.headers.get("x-parent-id");

    // Determine if this is a parent submission
    const formSenderType = formData.get("senderType") as string;
    const isParentSubmission =
      formSenderType === "parent" ||
      parentEmail ||
      subject?.toLowerCase().includes("absence") ||
      subject?.toLowerCase().includes("sick") ||
      description?.toLowerCase().includes("child:") ||
      description?.toLowerCase().includes("reason:");

    // If this is a parent submission, ensure admin is in recipients
    if (isParentSubmission && !recipients.includes("admin@daycare.com")) {
      recipients.push("admin@daycare.com");
    }

    // Create activity data with proper sender type and parent info
    const activityData: any = {
      subject,
      description: description || null,
      recipients,
      attachments: attachmentPaths,
      senderType: isParentSubmission ? "parent" : "admin",
      parentEmail: isParentSubmission ? parentEmail || null : null,
      parentId: isParentSubmission ? parentId || null : null,
    };

    // Create activity
    const activity = await prisma.activity.create({
      data: activityData,
    });

    // Create notifications
    const notificationPromises = recipients.map((email) =>
      prisma.notification.create({
        data: {
          activityId: activity.id,
          parentEmail: email,
          title: subject,
          message: description || "New update from daycare",
          type: "activity",
          isRead: false,
        },
      })
    );
    await Promise.all(notificationPromises);

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}

// --- PATCH: Update an activity ---
export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = parseInt(pathParts[pathParts.length - 1]);

    if (!id)
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );

    const { subject, description } = await request.json();

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: { subject, description },
    });

    // Update related notifications
    if (subject || description) {
      await prisma.notification.updateMany({
        where: { activityId: id },
        data: {
          title: subject,
          message: description || "New update from daycare",
        },
      });
    }

    return NextResponse.json({ success: true, activity: updatedActivity });
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    );
  }
}

// --- DELETE: Remove an activity ---
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    // Delete activity and cascade notifications
    await prisma.activity.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 }
    );
  }
}

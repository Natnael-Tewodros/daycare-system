import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

const parseActivityId = async (
  paramsPromise: RouteParams["params"],
): Promise<number | null> => {
  const params = await paramsPromise;
  const rawId = params?.id;

  if (!rawId) {
    return null;
  }

  const id = Number.parseInt(rawId, 10);

  return Number.isNaN(id) ? null : id;
};

const ensureJsonBody = async (request: NextRequest) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

export async function PATCH(request: NextRequest, context: RouteParams) {
  const id = await parseActivityId(context.params);

  if (id === null) {
    return NextResponse.json(
      { error: "Valid activity ID is required" },
      { status: 400 },
    );
  }

  const body = await ensureJsonBody(request);

  if (!body) {
    return NextResponse.json(
      { error: "Request body must be JSON" },
      { status: 400 },
    );
  }

  const { subject, description, recipients, attachments, isRead } = body as {
    subject?: string;
    description?: string | null;
    recipients?: string[];
    attachments?: string[];
    isRead?: boolean;
  };

  try {
    const activityUpdates: Record<string, unknown> = {};

    if (typeof subject === "string") {
      activityUpdates.subject = subject;
    }

    if (description !== undefined) {
      activityUpdates.description = description ?? null;
    }

    if (Array.isArray(recipients)) {
      activityUpdates.recipients = recipients;
    }

    if (Array.isArray(attachments)) {
      activityUpdates.attachments = attachments;
    }

    let updatedActivity = null;

    if (Object.keys(activityUpdates).length > 0) {
      updatedActivity = await prisma.activity.update({
        where: { id },
        data: activityUpdates,
      });

      if (subject !== undefined || description !== undefined) {
        await prisma.notification.updateMany({
          where: { activityId: id },
          data: {
            title: subject ?? undefined,
            message:
              description !== undefined
                ? description ?? "New update from daycare"
                : undefined,
          },
        });
      }
    }

    if (typeof isRead === "boolean") {
      await prisma.notification.updateMany({
        where: { activityId: id },
        data: { isRead },
      });
    }

    return NextResponse.json({
      success: true,
      activity: updatedActivity,
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 },
    );
  }
}

export async function GET(_request: NextRequest, context: RouteParams) {
  const id = await parseActivityId(context.params);

  if (id === null) {
    return NextResponse.json(
      { error: "Valid activity ID is required" },
      { status: 400 },
    );
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { notifications: true },
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  const id = await parseActivityId(context.params);

  if (id === null) {
    return NextResponse.json(
      { error: "Valid activity ID is required" },
      { status: 400 },
    );
  }

  try {
    await prisma.activity.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 },
    );
  }
}


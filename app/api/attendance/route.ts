import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all attendance records with child info (filtered to today for better performance/UX)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const includeAbsent = searchParams.get("includeAbsent") === "true";

    let start = new Date();
    start.setHours(0, 0, 0, 0);
    let end: Date | undefined = undefined;

    if (startParam) {
      const d = new Date(startParam);
      if (!isNaN(d.getTime())) start = d;
    }
    if (endParam) {
      const d = new Date(endParam);
      if (!isNaN(d.getTime())) end = d;
    }

    const dateFilter: any = { gte: start };
    if (end) dateFilter.lte = end;

    const attendances = await prisma.attendance.findMany({
      where: {
        createdAt: dateFilter,
      },
      include: {
        child: {
          select: {
            id: true,
            fullName: true,
            parentName: true,
            relationship: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If includeAbsent is true, also get children who didn't check in yesterday
    if (includeAbsent) {
      const presentChildIds = attendances.map((a) => a.childId);

      const absentChildren = await prisma.child.findMany({
        where: {
          id: {
            notIn: presentChildIds,
          },
        },
        select: {
          id: true,
          fullName: true,
          parentName: true,
          relationship: true,
        },
        parentEmail: true,
      });

    // After creating attendance, check for long absence (>= 60 days)
      return NextResponse.json({
        attendances,
        absentChildren,
      });
    }

    return NextResponse.json(attendances);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

// POST new check-in or mark absent
export async function POST(req: Request) {
  try {
    const {
      childId,
      broughtBy,
      checkInTime,
      status = "present",
    } = await req.json();

    // Validation
    if (!childId) {
      return NextResponse.json(
        { error: "Invalid input: childId required" },
        { status: 400 }
      );
    }

    // Determine the effective check-in time (if status indicates present/late)
    let effectiveCheckIn: Date | null = null;
    if (status === "present" || status === "late") {
      effectiveCheckIn = checkInTime ? new Date(checkInTime) : new Date();
    }

    // Auto-mark as 'late' if the check-in occurs after 09:00 local time
    let statusToSave = status;
    if ((status === "present" || status === undefined) && effectiveCheckIn) {
      const minutesSinceMidnight =
        effectiveCheckIn.getHours() * 60 + effectiveCheckIn.getMinutes();
      const lateThresholdMinutes = 9 * 60; // 9:00 AM
      if (minutesSinceMidnight > lateThresholdMinutes) {
        statusToSave = "late";
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        childId: Number(childId),
        status: statusToSave,
        broughtBy: broughtBy || null,
        checkInTime:
          (statusToSave === "present" || statusToSave === "late") &&
          effectiveCheckIn
            ? effectiveCheckIn
            : null,
      },
      include: {
        child: {
          select: {
            id: true,
            fullName: true,
            parentName: true,
            relationship: true,
          },
        },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Error creating attendance:", error);
    return NextResponse.json(
      { error: "Failed to create attendance" },
      { status: 500 }
    );
  }
}

// PUT check-out
export async function PUT(req: Request) {
  try {
    const { id, takenBy, checkOutTime } = await req.json();

    // Validation
    if (!id) {
      return NextResponse.json(
        { error: "Invalid input: id required" },
        { status: 400 }
      );
    }

    // Check if attendance exists and is open
    const existing = await prisma.attendance.findUnique({
      where: { id: Number(id) },
    });
    if (!existing || existing.checkOutTime) {
      return NextResponse.json(
        { error: "Attendance not found or already checked out" },
        { status: 404 }
      );
    }

            (async () => {
              try {
                const prev = await prisma.attendance.findFirst({
                  where: {
                    childId: Number(childId),
                    id: { not: attendance.id },
                  },
                  orderBy: { createdAt: "desc" },
                });

                if (prev) {
                  const diffMs = attendance.createdAt.getTime() - prev.createdAt.getTime();
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  if (diffDays >= 60) {
                    // Attempt to suspend/flag the child's approvalStatus and notify the parent
                    try {
                      // Build a suspension reason and update child status
                      const note = `suspended:ABSENT_TOO_LONG:${new Date().toISOString()}`;
                      await prisma.child.update({
                        where: { id: Number(childId) },
                        data: { approvalStatus: note },
                      });

                      // Create an activity and notifications for parent + admin
                      const parentEmail = attendance.child?.parentEmail || null;
                      const recipients = [] as string[];
                      if (parentEmail) recipients.push(parentEmail);
                      // ensure admin is included so staff see the event
                      recipients.push("admin@daycare.com");

                      const subject = `Child returned after long absence: ${attendance.child?.fullName}`;
                      const description = `The child ${attendance.child?.fullName} was last seen ${diffDays} days ago and has now checked in. The account has been temporarily suspended pending review.`;

                      const activity = await prisma.activity.create({
                        data: {
                          subject,
                          description,
                          recipients,
                          attachments: [],
                          senderType: "admin",
                        },
                      });

                      const notifPromises = recipients.map((email) =>
                        prisma.notification.create({
                          data: {
                            activityId: activity.id,
                            parentEmail: email,
                            title: subject,
                            message: description,
                            type: "info",
                            isRead: false,
                          },
                        })
                      );
                      await Promise.all(notifPromises);
                    } catch (innerErr) {
                      console.error("Failed to create suspension notifications:", innerErr);
                    }
                  }
                }
              } catch (err) {
                console.error("Error checking previous attendance:", err);
              }
            })();

            return NextResponse.json(attendance, { status: 201 });
    const updated = await prisma.attendance.update({
      where: { id: Number(id) },
      data: {
        takenBy: takenBy || null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : new Date(),
      },
      include: {
        child: {
          select: {
            id: true,
            fullName: true,
            parentName: true,
            relationship: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Failed to update attendance" },
      { status: 500 }
    );
  }
}

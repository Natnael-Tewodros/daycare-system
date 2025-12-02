import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Simple attendance route (clean, pre-auto-block behavior)
// GET: list attendances and optional absent children
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
      where: { createdAt: dateFilter },
      include: {
        child: {
          select: {
            id: true,
            fullName: true,
            parentName: true,
            relationship: true,
            parentEmail: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (includeAbsent) {
      const presentChildIds = attendances.map((a) => a.childId);
      const absentChildren = await prisma.child.findMany({
        where: presentChildIds.length ? { id: { notIn: presentChildIds } } : {},
        select: {
          id: true,
          fullName: true,
          parentName: true,
          relationship: true,
          parentEmail: true,
        },
      });

      return NextResponse.json({ attendances, absentChildren });
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

// POST: create attendance (no auto-block logic)
export async function POST(req: Request) {
  try {
    const {
      childId,
      broughtBy,
      checkInTime,
      status = "present",
    } = await req.json();
    if (!childId)
      return NextResponse.json(
        { error: "Invalid input: childId required" },
        { status: 400 }
      );

    let effectiveCheckIn: Date | null = null;
    if (status === "present" || status === "late") {
      effectiveCheckIn = checkInTime ? new Date(checkInTime) : new Date();
    }

    let statusToSave = status;
    if ((status === "present" || status === undefined) && effectiveCheckIn) {
      const minutesSinceMidnight =
        effectiveCheckIn.getHours() * 60 + effectiveCheckIn.getMinutes();
      const lateThresholdMinutes = 9 * 60;
      if (minutesSinceMidnight > lateThresholdMinutes) statusToSave = "late";
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
            parentEmail: true,
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

// PUT: update check-out
export async function PUT(req: Request) {
  try {
    const { id, takenBy, checkOutTime } = await req.json();
    if (!id)
      return NextResponse.json(
        { error: "Invalid input: id required" },
        { status: 400 }
      );

    const existing = await prisma.attendance.findUnique({
      where: { id: Number(id) },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Attendance not found" },
        { status: 404 }
      );

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
            parentEmail: true,
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

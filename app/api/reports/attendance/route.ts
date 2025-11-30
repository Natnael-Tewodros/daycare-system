import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "daily";
    const date = searchParams.get("date");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    let startDate: Date;
    let endDate: Date;

    // Calculate date range based on period
    if (period === "daily" && date) {
      startDate = new Date(date);
      endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
    } else if (period === "weekly") {
      if (date) {
        const selectedDate = new Date(date);
        const dayOfWeek = selectedDate.getDay();
        startDate = new Date(selectedDate);
        startDate.setDate(selectedDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Default to current week if no date provided
        const now = new Date();
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (period === "monthly" && year && month) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 1);
    } else if (period === "yearly" && year) {
      startDate = new Date(parseInt(year), 0, 1);
      endDate = new Date(parseInt(year) + 1, 0, 1);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // allow grouping by child (per-child attendance) when requested
    const groupBy = searchParams.get("groupBy") || "date";

    const attendances = await prisma.attendance.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        child: true,
      },
    });

    if (groupBy === "child") {
      // Group by child id and compute stats per child
      const childMap = new Map<
        string,
        {
          childId: number;
          fullName: string;
          present: number;
          absent: number;
          late: number;
          total: number;
        }
      >();

      attendances.forEach((att) => {
        const child = att.child;
        const key = String(child?.id ?? "unknown");
        if (!childMap.has(key)) {
          // compute a safe full name without mixing ?? and || in one expression
          let fullName = child?.fullName;
          if (!fullName) {
            const first = child?.firstName ?? "";
            const last = child?.lastName ?? "";
            const composed = `${first} ${last}`.trim();
            fullName = composed || "Unknown";
          }

          childMap.set(key, {
            childId: child?.id ?? 0,
            fullName,
            present: 0,
            absent: 0,
            late: 0,
            total: 0,
          });
        }
        const stats = childMap.get(key)!;
        stats.total++;
        switch (String(att.status).toLowerCase()) {
          case "present":
            stats.present++;
            break;
          case "absent":
            stats.absent++;
            break;
          case "late":
            stats.late++;
            break;
        }
      });

      const result = Array.from(childMap.values()).sort(
        (a, b) => b.total - a.total
      );
      return NextResponse.json(result);
    }

    // Default: Group by date and calculate statistics
    const attendanceMap = new Map<
      string,
      { present: number; absent: number; late: number; total: number }
    >();

    attendances.forEach((attendance) => {
      const dateKey = attendance.createdAt.toISOString().split("T")[0];

      if (!attendanceMap.has(dateKey)) {
        attendanceMap.set(dateKey, {
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        });
      }

      const stats = attendanceMap.get(dateKey)!;
      stats.total++;

      switch (String(attendance.status).toLowerCase()) {
        case "present":
          stats.present++;
          break;
        case "absent":
          stats.absent++;
          break;
        case "late":
          stats.late++;
          break;
      }
    });

    // Convert to array and sort by date
    const result = Array.from(attendanceMap.entries())
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching attendance report:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance report" },
      { status: 500 }
    );
  }
}

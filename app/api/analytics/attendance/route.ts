import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const type = searchParams.get('type') || 'daily';

    // Parse date range
    let startDate = new Date();
    let endDate = new Date();

    if (startParam) {
      startDate = new Date(startParam);
    } else {
      // Default to last 30 days
      startDate.setDate(startDate.getDate() - 30);
    }

    if (endParam) {
      endDate = new Date(endParam);
    }

    // Adjust dates based on report type
    switch (type) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        // Start of week (Monday)
        const dayOfWeek = startDate.getDay();
        const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    // Get all children to calculate total possible attendance
    const totalChildren = await prisma.child.count();

    // Get attendance records in the date range
    const attendances = await prisma.attendance.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        child: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Calculate statistics
    const totalPresent = attendances.filter(a => a.status === 'present').length;
    const totalAbsent = attendances.filter(a => a.status === 'absent').length;
    const totalLate = attendances.filter(a => a.status === 'late').length;
    
    // Calculate attendance rate
    const totalPossibleDays = totalChildren * Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const attendanceRate = totalPossibleDays > 0 ? (totalPresent / totalPossibleDays) * 100 : 0;

    // Group by date for daily data
    const dailyData = new Map();
    
    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyData.set(dateKey, { date: dateKey, present: 0, absent: 0, late: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Populate with actual data
    attendances.forEach(attendance => {
      const dateKey = attendance.createdAt.toISOString().split('T')[0];
      if (dailyData.has(dateKey)) {
        const dayData = dailyData.get(dateKey);
        if (attendance.status === 'present') dayData.present++;
        else if (attendance.status === 'absent') dayData.absent++;
        else if (attendance.status === 'late') dayData.late++;
        dailyData.set(dateKey, dayData);
      }
    });

    const dailyDataArray = Array.from(dailyData.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const report = {
      totalPresent,
      totalAbsent,
      totalLate,
      attendanceRate,
      dailyData: dailyDataArray,
      totalChildren,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      reportType: type,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching attendance analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance analytics" },
      { status: 500 }
    );
  }
}


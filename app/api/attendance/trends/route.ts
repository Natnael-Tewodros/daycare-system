import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'week'; // 'week' or 'year'

    if (period === 'week') {
      // Get last 7 days of attendance
      const last7Days = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const attendances = await prisma.attendance.findMany({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
          select: {
            status: true,
          },
        });

        const present = attendances.filter(a => a.status === 'present').length;
        const absent = attendances.filter(a => a.status === 'absent').length;
        const late = attendances.filter(a => a.status === 'late').length;

        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        last7Days.push({
          day: dayName,
          date: date.toISOString().split('T')[0],
          present,
          absent,
          late,
          total: present + absent + late,
        });
      }

      return NextResponse.json({ data: last7Days });
    } else if (period === 'year') {
      // Get last 12 months of attendance and enrollment
      const monthlyData = [];
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setMonth(nextDate.getMonth() + 1);

        // Count attendance for this month
        const attendances = await prisma.attendance.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        });

        // Count enrollments for this month
        const enrollments = await prisma.child.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        });

        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        monthlyData.push({
          month: monthName,
          date: date.toISOString().split('T')[0],
          attendance: attendances,
          enrollment: enrollments,
        });
      }

      return NextResponse.json({ data: monthlyData });
    }

    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching attendance trends:", error);
    return NextResponse.json({ error: "Failed to fetch attendance trends" }, { status: 500 });
  }
}


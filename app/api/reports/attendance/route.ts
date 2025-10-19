import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily';
    const date = searchParams.get('date');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    let startDate: Date;
    let endDate: Date;

    // Calculate date range based on period
    if (period === 'daily' && date) {
      startDate = new Date(date);
      endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
    } else if (period === 'weekly' && date) {
      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.getDay();
      startDate = new Date(selectedDate);
      startDate.setDate(selectedDate.getDate() - dayOfWeek);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
    } else if (period === 'monthly' && year && month) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 1);
    } else if (period === 'yearly' && year) {
      startDate = new Date(parseInt(year), 0, 1);
      endDate = new Date(parseInt(year) + 1, 0, 1);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Fetch attendance data
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

    // Group by date and calculate statistics
    const attendanceMap = new Map<string, { present: number; absent: number; late: number; total: number }>();

    attendances.forEach(attendance => {
      const dateKey = attendance.createdAt.toISOString().split('T')[0];
      
      if (!attendanceMap.has(dateKey)) {
        attendanceMap.set(dateKey, { present: 0, absent: 0, late: 0, total: 0 });
      }

      const stats = attendanceMap.get(dateKey)!;
      stats.total++;

      switch (attendance.status.toLowerCase()) {
        case 'present':
          stats.present++;
          break;
        case 'absent':
          stats.absent++;
          break;
        case 'late':
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
    console.error('Error fetching attendance report:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance report' }, { status: 500 });
  }
}

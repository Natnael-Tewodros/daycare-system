import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateWeeklyReport } from '@/lib/ai-report-generator';

// POST - Generate AI analysis report for a child
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { childId, weekStart, weekEnd, period } = body;

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    // Calculate week dates if not provided
    let endDate: Date;
    let startDate: Date;
    
    if (weekStart && weekEnd) {
      // Use provided dates
      startDate = new Date(weekStart);
      endDate = new Date(weekEnd);
      // Set to start and end of day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to last 7 days
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    }

    // Fetch child data
    const child = await prisma.child.findUnique({
      where: { id: Number(childId) },
      include: {
        organization: true,
        room: true,
        caregiver: true,
      },
    });

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Fetch daily observations for the week (optional: fallback if model not present)
    let observations: any[] = [];
    try {
      // @ts-expect-error: dailyObservation may not exist on some schemas; fallback handled
      if (prisma.dailyObservation?.findMany) {
        // @ts-ignore
        observations = await prisma.dailyObservation.findMany({
          where: {
            childId: Number(childId),
            observationDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { observationDate: 'asc' },
        });
      }
    } catch (_) {
      observations = [];
    }

    // Determine period label
    const normalizedPeriod = typeof period === 'string' ? period.toLowerCase() : 'weekly';
    const periodLabel = normalizedPeriod === 'daily' ? 'Daily' : normalizedPeriod === 'monthly' ? 'Monthly' : 'Weekly';

    // Generate the AI report
    const reportContent = generateWeeklyReport({
      child,
      attendances: [],
      observations,
      weekStart: startDate,
      weekEnd: endDate,
      periodLabel,
    });

    // Save the report to database
    const report = await prisma.report.create({
      data: {
        childId: Number(childId),
        title: `${periodLabel} Report - ${child.fullName} (${startDate.toLocaleDateString()}${periodLabel === 'Daily' ? '' : ` - ${endDate.toLocaleDateString()}`})`,
        content: reportContent,
        reportType: normalizedPeriod === 'daily' ? 'daily' : normalizedPeriod === 'monthly' ? 'monthly' : 'weekly',
        weekStart: startDate,
        weekEnd: endDate,
      },
      include: { child: true },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating AI report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


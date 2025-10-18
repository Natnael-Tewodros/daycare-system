import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    // Build where clause based on whether childId is provided
    const whereClause = childId && !isNaN(Number(childId)) 
      ? { childId: Number(childId) } 
      : {};

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: { child: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
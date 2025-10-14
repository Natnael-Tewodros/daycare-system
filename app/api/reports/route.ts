import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId || isNaN(Number(childId))) {
      return NextResponse.json({ error: 'childId is required' }, { status: 400 });
    }

    const reports = await prisma.report.findMany({
      where: { childId: Number(childId) },
      include: { child: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
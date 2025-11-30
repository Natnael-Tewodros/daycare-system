import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get count of children by relationship type
    const [motherCount, fatherCount] = await Promise.all([
      prisma.child.count({
        where: { relationship: 'MOTHER' }
      }),
      prisma.child.count({
        where: { relationship: 'FATHER' }
      })
    ]);

    return NextResponse.json([
      { type: 'Mother', count: motherCount },
      { type: 'Father', count: fatherCount }
    ]);
  } catch (error) {
    console.error('Error fetching children with reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch children with reports', details: String(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ childId: string }> }) {
  try {
    const { childId: childIdParam } = await params;
    const childId = Number(childIdParam);
    
    if (isNaN(childId)) {
      return NextResponse.json({ error: 'Invalid child ID' }, { status: 400 });
    }

    const activities = await prisma.activity.findMany({
      where: { childId },
      include: {
        child: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            gender: true,
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching child activities:', error);
    return NextResponse.json({ error: 'Failed to fetch child activities' }, { status: 500 });
  }
}

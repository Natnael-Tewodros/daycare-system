import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    if (!parentId) {
      return NextResponse.json({ error: 'Parent ID is required' }, { status: 400 });
    }

    // Verify the user exists and is a parent
    const user = await prisma.user.findUnique({
      where: { id: parentId },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch children for this parent
    const children = await prisma.child.findMany({
      where: { parentId: parentId },
      include: {
        organization: {
          select: { name: true }
        },
        servant: {
          select: { fullName: true }
        },
        room: {
          select: { name: true, ageRange: true }
        },
        attendances: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        reports: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(children);
  } catch (error) {
    console.error('Error fetching parent children:', error);
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 });
  }
}


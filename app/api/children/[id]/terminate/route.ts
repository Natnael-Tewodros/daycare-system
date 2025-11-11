import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/children/[id]/terminate
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const childId = Number.parseInt(id, 10);
    if (Number.isNaN(childId)) {
      return NextResponse.json({ error: 'Invalid child id' }, { status: 400 });
    }

    const { reason, notes } = await request.json().catch(() => ({ reason: 'OTHER', notes: '' }));
    const normalizedReason = String(reason || 'OTHER').toUpperCase();

    // Update approvalStatus to reflect termination and persist a human-readable reason in the status
    const statusValue = `terminated:${normalizedReason}${notes ? `:${String(notes).slice(0, 120)}` : ''}`;

    const child = await prisma.child.update({
      where: { id: childId },
      data: {
        approvalStatus: statusValue,
      },
    });

    return NextResponse.json({ success: true, child });
  } catch (error) {
    console.error('Error terminating child:', error);
    return NextResponse.json({ error: 'Failed to terminate child' }, { status: 500 });
  }
}



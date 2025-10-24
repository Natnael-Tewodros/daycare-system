import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const assignedServantId = formData.get('assignedServantId');
    const childIdsStr = formData.get('childIds');

    if (!assignedServantId || !childIdsStr) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const childIds = JSON.parse(childIdsStr as string);
    const servantId = parseInt(assignedServantId as string);

    // Update all selected children to assign them to the caregiver
    const updatePromises = childIds.map((childId: number) =>
      prisma.child.update({
        where: { id: childId },
        data: { assignedServantId: servantId }
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      message: 'Children assigned successfully',
      assignedCount: childIds.length 
    });

  } catch (error) {
    console.error('Error assigning children:', error);
    return NextResponse.json(
      { error: 'Failed to assign children' },
      { status: 500 }
    );
  }
}

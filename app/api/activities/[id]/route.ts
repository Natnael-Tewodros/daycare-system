import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
    }

    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
    }

    const formData = await request.formData();
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;
    const recipientsJson = formData.get('recipients') as string;
    const attachments = formData.getAll('attachments') as File[];

    // Validate required fields
    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    const recipients = JSON.parse(recipientsJson || '[]');
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'At least one recipient is required' }, { status: 400 });
    }

    // Get existing activity to preserve existing attachments
    const existingActivity = await prisma.activity.findUnique({ where: { id } });

    // Handle new file uploads
    const newAttachmentPaths: string[] = [];
    for (const file of attachments) {
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}-${file.name}`;
        const path = join(process.cwd(), 'public/uploads', filename);
        await writeFile(path, buffer);
        newAttachmentPaths.push(`/uploads/${filename}`);
      }
    }

    // Merge existing and new attachments
    const allAttachments = [...(existingActivity?.attachments || []), ...newAttachmentPaths];

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        subject,
        description: description || null,
        recipients: recipients,
        attachments: allAttachments,
      },
    });

    return NextResponse.json({
      success: true,
      activity: updatedActivity,
      message: 'Activity updated successfully'
    });

  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
    }

    await prisma.activity.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
  }
}

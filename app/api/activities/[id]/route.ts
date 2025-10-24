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
      where: { id },
      include: {
        child: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            gender: true,
          }
        }
      }
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
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const activityType = formData.get('activityType') as string;
    const date = formData.get('date') as string;
    const duration = formData.get('duration') as string;
    const notes = formData.get('notes') as string;

    // Validate required fields
    if (!title || !activityType || !date) {
      return NextResponse.json({ error: 'Title, activity type, and date are required' }, { status: 400 });
    }

    // Handle new image uploads
    const newImages: string[] = [];
    const imageFiles = formData.getAll('images') as File[];
    
    for (const imageFile of imageFiles) {
      if (imageFile && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}-${imageFile.name}`;
        const path = join(process.cwd(), 'public/uploads', filename);
        await writeFile(path, buffer);
        newImages.push(filename);
      }
    }

    // Get existing activity to preserve existing images
    const existingActivity = await prisma.activity.findUnique({
      where: { id }
    });

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        title,
        description: description || null,
        activityType: activityType as any,
        date: new Date(date),
        duration: duration ? parseInt(duration) : null,
        notes: notes || null,
        images: [...(existingActivity?.images || []), ...newImages], // Append new images to existing ones
      },
      include: {
        child: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            gender: true,
          }
        }
      }
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

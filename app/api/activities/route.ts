import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
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
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const childId = parseInt(formData.get('childId') as string);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const activityType = formData.get('activityType') as string;
    const date = formData.get('date') as string;
    const duration = formData.get('duration') as string;
    const notes = formData.get('notes') as string;

    // Validate required fields
    if (!childId || !title || !activityType || !date) {
      return NextResponse.json({ error: 'Child ID, title, activity type, and date are required' }, { status: 400 });
    }

    // Handle image uploads
    const images: string[] = [];
    const imageFiles = formData.getAll('images') as File[];
    
    for (const imageFile of imageFiles) {
      if (imageFile && imageFile.size > 0) {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}-${imageFile.name}`;
        const path = join(process.cwd(), 'public/uploads', filename);
        await writeFile(path, buffer);
        images.push(filename);
      }
    }

    const activity = await prisma.activity.create({
      data: {
        childId,
        title,
        description: description || null,
        activityType: activityType as any,
        date: new Date(date),
        duration: duration ? parseInt(duration) : null,
        notes: notes || null,
        images,
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
      activity,
      message: 'Activity created successfully'
    });

  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}

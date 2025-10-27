import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: {
        createdAt: 'desc'
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

    // Handle file uploads
    const attachmentPaths: string[] = [];
    for (const file of attachments) {
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${Date.now()}-${file.name}`;
        const path = join(process.cwd(), 'public/uploads', filename);
        await writeFile(path, buffer);
        attachmentPaths.push(`/uploads/${filename}`);
      }
    }

    // Create activity
    const activity = await prisma.$transaction(async (tx) => {
      return await tx.activity.create({
        data: {
          subject,
          description: description || null,
          recipients: recipients,
          attachments: attachmentPaths,
        },
      });
    });

    // Create notifications for each recipient
    if (recipients.length > 0) {
      console.log(`📧 Creating notifications for ${recipients.length} parent(s)`);
      
      // Create a notification for each recipient parent
      const notificationPromises = recipients.map(email => 
        prisma.notification.create({
          data: {
            activityId: activity.id,
            parentEmail: email,
            isRead: false,
          }
        })
      );
      
      await Promise.all(notificationPromises);
      console.log(`✅ Notifications created for parent(s):`, recipients);
    }

    return NextResponse.json({
      success: true,
      activity,
      message: 'Activity created successfully',
      notifiedParents: recipients.length
    });

  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}

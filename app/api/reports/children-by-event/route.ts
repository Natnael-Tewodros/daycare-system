import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all events with their participations
    const events = await prisma.event.findMany({
      where: {
        isActive: true,
      },
      include: {
        participations: {
          include: {
            child: true,
          },
        },
      },
    });

    // Process event data
    const result = events.map(event => {
      const participations = event.participations;
      const total = participations.length;
      
      const registered = participations.filter(p => p.status === 'REGISTERED').length;
      const attended = participations.filter(p => p.status === 'ATTENDED').length;
      const absent = participations.filter(p => p.status === 'ABSENT').length;
      const cancelled = participations.filter(p => p.status === 'CANCELLED').length;

      return {
        event: event.title,
        registered,
        attended,
        absent,
        cancelled,
        total,
        eventDate: event.eventDate,
        eventType: event.eventType,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching children by event report:', error);
    return NextResponse.json({ error: 'Failed to fetch children by event report' }, { status: 500 });
  }
}

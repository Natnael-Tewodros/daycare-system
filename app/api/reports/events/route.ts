import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        eventDate: true,
        participations: {
          select: {
            id: true,
            status: true,
            notes: true,
            child: {
              select: {
                id: true,
                fullName: true,
                organization: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                room: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        eventDate: 'desc',
      },
    });

    // Transform the data for the report
    const reportData = events.map(event => {
      const participations = event.participations || [];
      const attended = participations.filter(p => p.status === 'ATTENDED').length;
      const registered = participations.length;
      
      return {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.eventDate,
        totalRegistered: registered,
        totalAttended: attended,
        attendanceRate: registered > 0 ? Math.round((attended / registered) * 100) : 0,
        participations: participations.map(p => ({
          childId: p.child?.id || null,
          childName: p.child?.fullName || 'Unknown',
          organization: p.child?.organization?.name || 'N/A',
          room: p.child?.room?.name || 'N/A',
          status: p.status,
          notes: p.notes || null
        }))
      };
    });

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error fetching event reports:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        error: 'Failed to fetch event reports',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

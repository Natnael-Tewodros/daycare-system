import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Since there's no Event model in the current schema, 
    // we'll create mock data for demonstration purposes
    // In a real implementation, you would have an Event model
    
    const currentDate = new Date();
    
    // Mock event data - replace with actual database queries when Event model is added
    const mockEvents = [
      {
        id: 1,
        title: "Annual Day Celebration",
        type: "Celebration",
        date: new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "upcoming"
      },
      {
        id: 2,
        title: "Parent-Teacher Meeting",
        type: "Meeting",
        date: new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: "upcoming"
      },
      {
        id: 3,
        title: "Sports Day",
        type: "Sports",
        date: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        status: "past"
      },
      {
        id: 4,
        title: "Cultural Program",
        type: "Cultural",
        date: new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        status: "past"
      },
      {
        id: 5,
        title: "Health Check-up",
        type: "Health",
        date: new Date(currentDate.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        status: "upcoming"
      }
    ];

    const totalEvents = mockEvents.length;
    const upcomingEvents = mockEvents.filter(e => e.status === 'upcoming').length;
    const pastEvents = mockEvents.filter(e => e.status === 'past').length;

    // Group by event type
    const eventTypeMap = new Map();
    mockEvents.forEach(event => {
      if (eventTypeMap.has(event.type)) {
        eventTypeMap.set(event.type, eventTypeMap.get(event.type) + 1);
      } else {
        eventTypeMap.set(event.type, 1);
      }
    });

    const eventTypes = Array.from(eventTypeMap.entries()).map(([type, count]) => ({
      type,
      count,
    })).sort((a, b) => b.count - a.count);

    // Upcoming events details
    const upcomingEventsDetails = mockEvents
      .filter(e => e.status === 'upcoming')
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5); // Next 5 upcoming events

    // Recent past events
    const recentPastEvents = mockEvents
      .filter(e => e.status === 'past')
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5); // Last 5 past events

    const report = {
      totalEvents,
      upcomingEvents,
      pastEvents,
      eventTypes,
      upcomingEventsDetails,
      recentPastEvents,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching events analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch events analytics" },
      { status: 500 }
    );
  }
}


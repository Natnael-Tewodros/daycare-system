import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch daily observations for a child
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    const whereClause: any = { childId: Number(childId) };

    if (startDate && endDate) {
      whereClause.observationDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const observations = await prisma.dailyObservation.findMany({
      where: whereClause,
      include: { child: true },
      orderBy: { observationDate: 'desc' },
    });

    return NextResponse.json(observations);
  } catch (error) {
    console.error('Error fetching daily observations:', error);
    return NextResponse.json({ error: 'Failed to fetch observations' }, { status: 500 });
  }
}

// POST - Create a new daily observation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      childId,
      observationDate,
      activities,
      engagementLevel,
      skillNotes,
      mood,
      cooperation,
      socialNotes,
      healthStatus,
      hygieneNotes,
      energyLevel,
      eatingHabits,
      breakfastStatus,
      lunchStatus,
      snackStatus,
      napStartTime,
      napDuration,
      sleepQuality,
      teacherNotes,
    } = body;

    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    const observation = await prisma.dailyObservation.create({
      data: {
        childId: Number(childId),
        observationDate: observationDate ? new Date(observationDate) : new Date(),
        activities: activities || [],
        engagementLevel,
        skillNotes,
        mood,
        cooperation,
        socialNotes,
        healthStatus,
        hygieneNotes,
        energyLevel,
        eatingHabits,
        breakfastStatus,
        lunchStatus,
        snackStatus,
        napStartTime: napStartTime ? new Date(napStartTime) : null,
        napDuration: napDuration ? Number(napDuration) : null,
        sleepQuality,
        teacherNotes,
      },
      include: { child: true },
    });

    return NextResponse.json(observation, { status: 201 });
  } catch (error) {
    console.error('Error creating daily observation:', error);
    return NextResponse.json({ error: 'Failed to create observation' }, { status: 500 });
  }
}

// PUT - Update a daily observation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Observation ID is required' }, { status: 400 });
    }

    // Convert date strings to Date objects if present
    if (updateData.observationDate) {
      updateData.observationDate = new Date(updateData.observationDate);
    }
    if (updateData.napStartTime) {
      updateData.napStartTime = new Date(updateData.napStartTime);
    }
    if (updateData.napDuration) {
      updateData.napDuration = Number(updateData.napDuration);
    }

    const observation = await prisma.dailyObservation.update({
      where: { id: Number(id) },
      data: updateData,
      include: { child: true },
    });

    return NextResponse.json(observation);
  } catch (error) {
    console.error('Error updating daily observation:', error);
    return NextResponse.json({ error: 'Failed to update observation' }, { status: 500 });
  }
}


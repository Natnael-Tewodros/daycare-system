// app/api/rooms/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      include: { organization: true, children: true, servants: true },
    });
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, ageRange, organizationId } = await req.json();
    const room = await prisma.room.create({
      data: { name, ageRange, organizationId: organizationId || undefined },
    });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

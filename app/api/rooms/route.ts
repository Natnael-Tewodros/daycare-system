import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all rooms
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      include: { servants: true, children: true },
    });
    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

// POST new room
export async function POST(req: Request) {
  try {
    const { name, ageRange } = await req.json();
    const room = await prisma.room.create({
      data: { name, ageRange },
    });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}

// PUT update room
export async function PUT(req: Request) {
  try {
    const { id, name, ageRange } = await req.json();
    const updated = await prisma.room.update({
      where: { id },
      data: { name, ageRange },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}

// DELETE room
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    await prisma.room.delete({ where: { id } });
    return NextResponse.json({ message: "Room deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
}

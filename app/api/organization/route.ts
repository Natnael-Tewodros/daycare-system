// app/api/children/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const {
    fullName,
    dateOfBirth,
    gender,
    relationship,
    parentName,
    organizationId,
    servantId,
    option,
    childInfoFile,
    site,
  } = await req.json();

  // Calculate age in months
  const birthDate = new Date(dateOfBirth);
  const now = new Date();
  const ageInMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());

  // Determine room based on age
  let roomName = "";
  if (ageInMonths >= 0 && ageInMonths <= 12) roomName = "Room 1";      // 0-1 year
  else if (ageInMonths > 12 && ageInMonths <= 24) roomName = "Room 2"; // 1-2 years
  else if (ageInMonths > 24 && ageInMonths <= 48) roomName = "Room 3"; // 2-4 years
  else roomName = "Unassigned";

  // Find the room id
  const room = await prisma.room.findFirst({
    where: { name: roomName, organizationId },
  });

  const child = await prisma.child.create({
    data: {
      fullName,
      dateOfBirth: birthDate,
      gender,
      relationship,
      parentName,
      organizationId,
      servantId,
      option,
      childInfoFile,
      site,
      roomId: room?.id,
    },
  });

  return NextResponse.json(child);
}

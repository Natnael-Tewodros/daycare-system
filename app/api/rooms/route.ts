// app/api/rooms/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Function to calculate age in months
const calculateAgeInMonths = (dateOfBirth: string | Date): number => {
  try {
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      console.error("Invalid date:", dateOfBirth);
      return 0;
    }
    const now = new Date();
    let ageInMonths =
      (now.getFullYear() - birthDate.getFullYear()) * 12 +
      (now.getMonth() - birthDate.getMonth());

    // If the current day is before the birth day, subtract one month
    if (now.getDate() < birthDate.getDate()) {
      ageInMonths--;
    }

    return ageInMonths;
  } catch (error) {
    console.error("Error calculating age:", error, "dateOfBirth:", dateOfBirth);
    return 0;
  }
};

// Function to parse age range and check if child fits
const childFitsInAgeRange = (
  childAgeInMonths: number,
  ageRange: string
): boolean => {
  // Parse age range like "3 months - 1 year" or "1 year - 2 years"
  const rangeMatch = ageRange.match(
    /(\d+)\s*(month|year)s?\s*-\s*(\d+)\s*(month|year)s?/i
  );
  if (!rangeMatch) return false;

  const [, minValue, minUnit, maxValue, maxUnit] = rangeMatch;

  // Convert to months
  const minMonths = minUnit.toLowerCase().includes("year")
    ? parseInt(minValue) * 12
    : parseInt(minValue);
  const maxMonths = maxUnit.toLowerCase().includes("year")
    ? parseInt(maxValue) * 12
    : parseInt(maxValue);

  return childAgeInMonths >= minMonths && childAgeInMonths <= maxMonths;
};

export async function GET() {
  try {
    // Get all rooms with their organization, children, and caregivers
    const rooms = await prisma.room.findMany({
      include: {
        organization: true,
        children: true,
        caregivers: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            assignedRoomId: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Get all children to process room assignments
    const allChildren = await prisma.child.findMany({
      include: {
        room: true,
      },
    });

    // Group rooms by name and organization to merge duplicates
    const roomGroups = new Map();

    for (const room of rooms) {
      const key = `${room.name.toLowerCase()}`;
      // Determine a sensible default ageRange when not provided
      const defaultAgeRange =
        room.ageRange ||
        (room.name.toLowerCase().includes("growing")
          ? "2 years - 4 years"
          : "All ages");

      if (!roomGroups.has(key)) {
        const roomChildren = allChildren.filter(
          (child) => child.roomId === room.id
        );
        // Force the Growing Star ageRange to the desired value regardless of stored value
        const forcedAgeRange = room.name.toLowerCase().includes("growing")
          ? "2 years - 4 years"
          : defaultAgeRange;

        roomGroups.set(key, {
          ...room,
          ageRange: forcedAgeRange,
          childrenCount: roomChildren.length,
          children: roomChildren,
          // Use the directly fetched caregivers
          servants: room.caregivers,
          // Store original IDs for reference
          originalIds: [room.id],
        });
      } else {
        // Merge duplicate rooms
        const existingRoom = roomGroups.get(key);
        const roomChildren = allChildren.filter(
          (child) => child.roomId === room.id
        );

        // Merge children
        existingRoom.children = [...existingRoom.children, ...roomChildren];
        existingRoom.childrenCount += roomChildren.length;

        // Merge caregivers, avoiding duplicates
        const caregiverIds = new Set(
          existingRoom.caregivers.map((c: any) => c.id)
        );
        const newCaregivers = room.caregivers.filter(
          (c: any) => c && !caregiverIds.has(c.id)
        );

        existingRoom.caregivers = [
          ...existingRoom.caregivers,
          ...newCaregivers,
        ];

        // Ensure both properties are in sync
        existingRoom.servants = existingRoom.caregivers;

        // If this room is a Growing room, force the ageRange to the desired value
        if (
          existingRoom.name &&
          existingRoom.name.toLowerCase().includes("growing")
        ) {
          existingRoom.ageRange = "2 years - 4 years";
        }

        // Track original IDs
        existingRoom.originalIds = [
          ...(existingRoom.originalIds || []),
          room.id,
        ];
      }
    }

    // Convert map values to array and sort
    const processedRooms = Array.from(roomGroups.values()).sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Define order: Infant (1), Toddler (2), Growing Star (3)
      const getOrder = (name: string): number => {
        if (name.includes("infant")) return 1;
        if (name.includes("toddler")) return 2;
        if (name.includes("growing star") || name.includes("growing start"))
          return 3;
        return 99; // Other rooms go last
      };

      return getOrder(aName) - getOrder(bName);
    });

    return NextResponse.json(processedRooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to fetch rooms",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, ageRange, organizationId } = await req.json();

    // Check if room with same name already exists in this organization
    const existingRoom = await prisma.room.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive", // Case-insensitive comparison
        },
        organizationId: organizationId,
      },
    });

    if (existingRoom) {
      return NextResponse.json(
        {
          error: "Room already exists",
          room: existingRoom,
        },
        { status: 400 }
      );
    }

    const room = await prisma.room.create({
      data: {
        name,
        ageRange,
        organization: {
          connect: { id: organizationId },
        },
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("Error creating room:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to create room",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

// app/api/rooms/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Function to calculate age in months
const calculateAgeInMonths = (dateOfBirth: string | Date): number => {
  try {
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      console.error('Invalid date:', dateOfBirth);
      return 0;
    }
    const now = new Date();
    let ageInMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
    
    // If the current day is before the birth day, subtract one month
    if (now.getDate() < birthDate.getDate()) {
      ageInMonths--;
    }
    
    return ageInMonths;
  } catch (error) {
    console.error('Error calculating age:', error, 'dateOfBirth:', dateOfBirth);
    return 0;
  }
};

// Function to parse age range and check if child fits
const childFitsInAgeRange = (childAgeInMonths: number, ageRange: string): boolean => {
  // Parse age range like "3 months - 1 year" or "1 year - 2 years"
  const rangeMatch = ageRange.match(/(\d+)\s*(month|year)s?\s*-\s*(\d+)\s*(month|year)s?/i);
  if (!rangeMatch) return false;
  
  const [, minValue, minUnit, maxValue, maxUnit] = rangeMatch;
  
  // Convert to months
  const minMonths = minUnit.toLowerCase().includes('year') ? parseInt(minValue) * 12 : parseInt(minValue);
  const maxMonths = maxUnit.toLowerCase().includes('year') ? parseInt(maxValue) * 12 : parseInt(maxValue);
  
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
            assignedRoomId: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    // Get all children to process room assignments
    const allChildren = await prisma.child.findMany({
      include: {
        room: true
      }
    });

    // Process rooms: add children, sort, and transform
    const processedRooms = rooms
      // Add children data to each room
      .map((room) => {
        const roomChildren = allChildren.filter(child => child.roomId === room.id);
        return {
          ...room,
          childrenCount: roomChildren.length,
          children: roomChildren,
          servants: room.caregivers // Add alias for backward compatibility
        };
      })
      // Sort rooms: Infant -> Toddler -> Growing Star -> Others
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Define order: Infant (1), Toddler (2), Growing Star (3)
        const getOrder = (name: string): number => {
          if (name.includes('infant')) return 1;
          if (name.includes('toddler')) return 2;
          if (name.includes('growing star') || name.includes('growing start')) return 3;
          return 99; // Other rooms go last
        };
        
        return getOrder(aName) - getOrder(bName);
      });

    return NextResponse.json(processedRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to fetch rooms',
      message: errorMessage,
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, ageRange, organizationId } = await req.json();
    const room = await prisma.room.create({
      data: { 
        name, 
        ageRange, 
        organizationId: organizationId || undefined 
      },
    });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ 
      error: 'Failed to create room',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

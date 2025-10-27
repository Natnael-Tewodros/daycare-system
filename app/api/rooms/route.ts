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
    // Get all rooms
    const rooms = await prisma.room.findMany({
      include: { 
        organization: true, 
        servants: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            canTransferRooms: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Get all children
    const allChildren = await prisma.child.findMany({
      select: {
        id: true,
        fullName: true,
        dateOfBirth: true,
        gender: true,
        parentName: true,
        parentEmail: true,
        profilePic: true,
        createdAt: true,
        updatedAt: true,
        roomId: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Organize children by room assignment and age ranges
    const roomsWithChildren = rooms.map(room => {
      // First, get children actually assigned to this room
      const assignedChildren = allChildren.filter(child => child.roomId === room.id);
      
      // Then, get children that fit the age range but aren't assigned to any room
      const unassignedChildrenInAgeRange = allChildren.filter(child => {
        if (child.roomId) return false; // Skip already assigned children
        if (!room.ageRange) return false; // Skip if room has no age range defined
        
        try {
          const ageInMonths = calculateAgeInMonths(child.dateOfBirth);
          return childFitsInAgeRange(ageInMonths, room.ageRange);
        } catch (error) {
          console.error(`Error calculating age for child ${child.id}:`, error);
          return false;
        }
      });

      // Combine assigned children and unassigned children in age range
      const childrenInThisRoom = [...assignedChildren, ...unassignedChildrenInAgeRange];

      // Map room names to class names
      const getClassName = (roomName: string): string => {
        if (!roomName) return 'Unnamed Room';
        const name = roomName.toLowerCase();
        if (name.includes('room 1')) return 'Infants';
        if (name.includes('room 2')) return 'Toddlers';
        if (name.includes('room 3')) return 'Growing Stars';
        if (name.includes('default') || name.includes('infant')) return 'Infants';
        if (name.includes('toddler')) return 'Toddlers';
        if (name.includes('preschool')) return 'Growing Stars';
        return roomName.replace(/\s*-\s*[A-Z_]+$/, ''); // Clean up organization suffix
      };

      return {
        ...room,
        name: getClassName(room.name),
        ageRange: room.ageRange || 'No age range specified',
        children: childrenInThisRoom,
        assignedChildren: assignedChildren,
        unassignedChildren: unassignedChildrenInAgeRange
      };
    });

    return NextResponse.json(roomsWithChildren);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error('Error details:', errorDetails);
    return NextResponse.json({ 
      error: 'Failed to fetch rooms',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 });
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

// app/api/organization/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Return mock data for now to test the frontend
    const mockOrganizations = [
      {
        id: 1,
        name: "INSA",
        type: "INSA",
        childrenCount: 3,
        children: [],
        rooms: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: "AI",
        type: "AI", 
        childrenCount: 4,
        children: [],
        rooms: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        name: "Ministry of Peace",
        type: "MINISTRY_OF_PEACE",
        childrenCount: 2,
        children: [],
        rooms: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: 4,
        name: "Finance Security",
        type: "FINANCE_SECURITY",
        childrenCount: 1,
        children: [],
        rooms: [],
        createdAt: new Date().toISOString(),
      }
    ];

    return NextResponse.json(mockOrganizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, type } = await req.json();
    
    // For now, just return success
    return NextResponse.json({ 
      id: Date.now(), 
      name, 
      type, 
      childrenCount: 0,
      children: [],
      rooms: [],
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }
}
// app/api/organization/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        children: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            gender: true,
            parentName: true,
            parentEmail: true,
            site: true,
            createdAt: true
          }
        },
        rooms: {
          select: {
            id: true,
            name: true,
            ageRange: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform the data to include counts
    const organizationsWithCounts = organizations.map(org => ({
      id: org.id,
      name: org.name,
      type: org.type,
      childrenCount: org.children.length,
      children: org.children,
      rooms: org.rooms,
      createdAt: org.createdAt.toISOString()
    }));

    return NextResponse.json(organizationsWithCounts);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, type } = await req.json();
    
    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    // Check if organization with same name already exists
    const existingOrg = await prisma.organization.findFirst({
      where: { 
        name: { equals: name, mode: 'insensitive' }
      }
    });

    if (existingOrg) {
      return NextResponse.json({ error: 'Organization with this name already exists' }, { status: 409 });
    }

    const organization = await prisma.organization.create({
      data: {
        name: name.trim(),
        type: type as any
      },
      include: {
        children: true,
        rooms: true
      }
    });

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      type: organization.type,
      childrenCount: organization.children.length,
      children: organization.children,
      rooms: organization.rooms,
      createdAt: organization.createdAt.toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { parentName, childName, childAge, email, phone, preferredStartDate, notes, organization, site, gender, dateOfBirth } = await request.json();

    // Basic validation
    if (!parentName || !childName || !childAge || !email) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Look up parent by email if they have an account
    const parent = await prisma.user.findFirst({
      where: { 
        email: { equals: email, mode: 'insensitive' },
        role: 'PARENT'
      }
    });

    const enrollmentRequest = await prisma.enrollmentRequest.create({
      data: {
        parentName,
        childName,
        childAge: parseInt(childAge.toString()),
        email,
        phone,
        preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : null,
        notes,
      },
    });

    // If parent account exists, we can optionally create a child record linked to them
    // This would be useful for auto-approval scenarios
    let linkedChild = null;
    if (parent && organization && site && gender && dateOfBirth) {
      // Find or create organization
      let org = await prisma.organization.findFirst({
        where: { name: { equals: organization, mode: 'insensitive' } }
      });
      
      if (!org) {
        org = await prisma.organization.create({
          data: {
            name: organization,
            type: organization as any || 'INSA'
          }
        });
      }

      // Create child record linked to parent
      linkedChild = await prisma.child.create({
        data: {
          fullName: childName,
          parentName,
          dateOfBirth: new Date(dateOfBirth),
          gender: gender as any,
          relationship: 'OTHER',
          site: site as any,
          organizationId: org.id,
          parentId: parent.id, // Link to parent account
          option: 'Enrollment Request'
        }
      });
    }

    return NextResponse.json({ 
      message: 'Enrollment request submitted successfully', 
      data: enrollmentRequest,
      linkedChild: linkedChild ? { id: linkedChild.id, fullName: linkedChild.fullName } : null
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating enrollment request:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const enrollmentRequests = await prisma.enrollmentRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: enrollmentRequests }, { status: 200 });
  } catch (error) {
    console.error('Error fetching enrollment requests:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    // Basic validation
    if (!id || !status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ message: 'Invalid ID or status' }, { status: 400 });
    }

    const updatedRequest = await prisma.enrollmentRequest.update({
      where: { id: parseInt(id.toString()) },
      data: { status },
    });

    return NextResponse.json({ message: 'Status updated successfully', data: updatedRequest }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating enrollment request:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
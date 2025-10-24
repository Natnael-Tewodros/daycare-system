import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { parentName, childName, childAge, dateOfBirth, address, email, phone, preferredStartDate, careNeeded, notes } = await request.json();

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
        notes: notes ? `${notes}\n\nAddress: ${address}\nCare Needed: ${careNeeded}` : `Address: ${address}\nCare Needed: ${careNeeded}`,
      },
    });

    // Note: Child registration will be handled by admin after approval
    // This enrollment request contains basic information for admin review

    return NextResponse.json({ 
      message: 'Enrollment request submitted successfully', 
      data: enrollmentRequest
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
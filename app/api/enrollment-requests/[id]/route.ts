import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Update enrollment request status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status } = await request.json();

    // Validate status
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be pending, approved, or rejected' },
        { status: 400 }
      );
    }

    // Validate ID
    const requestId = parseInt(id);
    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    // Update the enrollment request
    const updatedRequest = await prisma.enrollmentRequest.update({
      where: { id: requestId },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedRequest
    });

  } catch (error) {
    console.error('Error updating enrollment request:', error);
    return NextResponse.json(
      { error: 'Failed to update enrollment request' },
      { status: 500 }
    );
  }
}

// Get single enrollment request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const requestId = parseInt(id);

    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    const enrollmentRequest = await prisma.enrollmentRequest.findUnique({
      where: { id: requestId }
    });

    if (!enrollmentRequest) {
      return NextResponse.json(
        { error: 'Enrollment request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: enrollmentRequest
    });

  } catch (error) {
    console.error('Error fetching enrollment request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollment request' },
      { status: 500 }
    );
  }
}

// Delete enrollment request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const requestId = parseInt(id);

    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    // Check if the request exists
    const existingRequest = await prisma.enrollmentRequest.findUnique({
      where: { id: requestId }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Enrollment request not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending requests
    if (existingRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending requests can be cancelled' },
        { status: 400 }
      );
    }

    // Delete the enrollment request
    await prisma.enrollmentRequest.delete({
      where: { id: requestId }
    });

    return NextResponse.json({
      success: true,
      message: 'Enrollment request cancelled successfully'
    });

  } catch (error) {
    console.error('Error deleting enrollment request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel enrollment request' },
      { status: 500 }
    );
  }
}

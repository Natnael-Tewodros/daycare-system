import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get single enrollment request
export async function GET(request: NextRequest, { params }: { params: any }) {
  try {
    const { id } = await params;
    const requestId = parseInt(id, 10);

    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: "Invalid request ID" },
        { status: 400 }
      );
    }

    const enrollmentRequest = await prisma.enrollmentRequest.findUnique({
      where: { id: requestId },
    });

    if (!enrollmentRequest) {
      return NextResponse.json(
        { error: "Enrollment request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: enrollmentRequest },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching enrollment request:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollment request" },
      { status: 500 }
    );
  }
}

// Update enrollment request status
export async function PATCH(request: NextRequest, { params }: { params: any }) {
  try {
    const { id } = await params;
    const requestId = parseInt(id, 10);
    const { status } = await request.json();

    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: "Invalid request ID" },
        { status: 400 }
      );
    }

    if (!status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be pending, approved, or rejected" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.enrollmentRequest.update({
      where: { id: requestId },
      data: { status },
    });

    return NextResponse.json(
      { success: true, data: updatedRequest },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating enrollment request:", error);
    return NextResponse.json(
      { error: "Failed to update enrollment request" },
      { status: 500 }
    );
  }
}

// Delete enrollment request
export async function DELETE(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id } = await params;
    const requestId = parseInt(id, 10);

    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: "Invalid request ID" },
        { status: 400 }
      );
    }

    const existingRequest = await prisma.enrollmentRequest.findUnique({
      where: { id: requestId },
    });
    if (!existingRequest) {
      return NextResponse.json(
        { error: "Enrollment request not found" },
        { status: 404 }
      );
    }

    // Allow deletion regardless of status for admin; keep earlier behavior if you prefer to restrict
    await prisma.enrollmentRequest.delete({ where: { id: requestId } });

    return NextResponse.json(
      { success: true, message: "Enrollment request deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting enrollment request:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete enrollment request" },
      { status: 500 }
    );
  }
}

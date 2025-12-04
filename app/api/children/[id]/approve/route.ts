import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Approve or reject a child registration
export async function PATCH(request: NextRequest, { params }: { params: any }) {
  try {
    const { approvalStatus } = await request.json();
    const { id } = await params;
    const childId = parseInt(id);

    if (
      !approvalStatus ||
      !["pending", "approved", "rejected"].includes(approvalStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid approval status" },
        { status: 400 }
      );
    }

    const updatedChild = await prisma.child.update({
      where: { id: childId },
      data: {
        approvalStatus,
        updatedAt: new Date(),
      },
      include: {
        organization: true,
        room: true,
        parent: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Child ${
        approvalStatus === "approved" ? "approved" : "rejected"
      } successfully`,
      child: updatedChild,
    });
  } catch (error) {
    console.error("Error updating child approval status:", error);
    return NextResponse.json(
      {
        error: "Failed to update approval status",
      },
      { status: 500 }
    );
  }
}

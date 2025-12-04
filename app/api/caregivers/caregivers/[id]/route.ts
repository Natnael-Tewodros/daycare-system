import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: any }) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const { id } = await params;
    const caregiverId = parseInt(id);

    // Handle JSON request (simple room assignment update from table)
    if (contentType.includes("application/json")) {
      const body = await request.json();

      if (body.assignedRoomId !== undefined) {
        const updatedCaregiver = await prisma.caregiver.update({
          where: { id: caregiverId },
          data: {
            assignedRoomId:
              body.assignedRoomId === null || body.assignedRoomId === "none"
                ? null
                : parseInt(body.assignedRoomId as string),
          },
          include: {
            assignedRoom: {
              select: { id: true, name: true, ageRange: true },
            },
          },
        });
        return NextResponse.json(updatedCaregiver);
      }
    }

    // Handle form data request (full update with files)
    const formData = await request.formData();

    // Check if this is a room assignment update (from the table via form data)
    const assignedRoomId = formData.get("assignedRoomId");
    if (assignedRoomId !== null) {
      const updatedCaregiver = await prisma.caregiver.update({
        where: { id: caregiverId },
        data: {
          assignedRoomId:
            assignedRoomId === "none"
              ? null
              : parseInt(assignedRoomId as string),
        },
        include: {
          assignedRoom: {
            select: { id: true, name: true, ageRange: true },
          },
        },
      });
      return NextResponse.json(updatedCaregiver);
    }

    // Full update with form data
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const site = formData.get("site") as string;
    const organizationType = formData.get("organizationType") as string;
    const canTransferRooms = formData.get("canTransferRooms") === "true";
    const medicalReportFile = formData.get("medicalReport") as File | null;

    // Only email is required
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if email already exists (excluding current caregiver)
    const existingCaregiver = await prisma.caregiver.findFirst({
      where: {
        email,
        id: { not: caregiverId },
      },
    });

    if (existingCaregiver) {
      return NextResponse.json(
        { error: "A caregiver with this email already exists" },
        { status: 409 }
      );
    }

    const updateData: any = {
      fullName: fullName || null,
      email,
      phone: phone || null,
      siteId: null, // TODO: Update to use actual site ID from database
      organizationType: organizationType
        ? (organizationType as
            | "INSA"
            | "AI"
            | "MINISTRY_OF_PEACE"
            | "FINANCE_SECURITY")
        : undefined,
      canTransferRooms,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Handle medical report file upload
    if (medicalReportFile && medicalReportFile.size > 0) {
      // Validate file type
      if (medicalReportFile.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Only PDF files are allowed for medical reports" },
          { status: 400 }
        );
      }

      const bytes = await medicalReportFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `medical-report-${caregiverId}-${Date.now()}.pdf`;
      const path = `public/uploads/${filename}`;

      // Save file (in a real app, you'd use a proper file storage service)
      const fs = require("fs");
      const pathModule = require("path");
      const uploadDir = pathModule.join(process.cwd(), "public", "uploads");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(pathModule.join(process.cwd(), path), buffer);
      updateData.medicalReport = filename;
    }

    const updatedCaregiver = await prisma.caregiver.update({
      where: { id: caregiverId },
      data: updateData,
      include: {
        assignedRoom: {
          select: { id: true, name: true, ageRange: true },
        },
      },
    });

    return NextResponse.json(updatedCaregiver);
  } catch (error) {
    console.error("Error updating caregiver:", error);
    return NextResponse.json(
      {
        error: "Failed to update caregiver",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    const { id } = await params;
    const caregiverId = parseInt(id);

    if (isNaN(caregiverId)) {
      return NextResponse.json(
        { error: "Invalid caregiver ID format. Must be a number." },
        { status: 400 }
      );
    }

    // Check if caregiver exists
    const caregiver = await prisma.caregiver.findUnique({
      where: { id: caregiverId },
      include: {
        children: true,
        assignedRoom: true,
      },
    });

    if (!caregiver) {
      return NextResponse.json(
        { error: `Caregiver with ID ${caregiverId} not found` },
        { status: 404 }
      );
    }

    // Check for existing relationships that might prevent deletion
    if (caregiver.children && caregiver.children.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete caregiver with assigned children. Please reassign or remove the children first.",
          details: {
            assignedChildrenCount: caregiver.children.length,
            childrenIds: caregiver.children.map((c) => c.id),
          },
        },
        { status: 400 }
      );
    }

    // Delete the caregiver
    await prisma.caregiver.delete({
      where: { id: caregiverId },
    });

    return NextResponse.json({
      message: "Caregiver deleted successfully",
      deletedCaregiver: {
        id: caregiver.id,
        name: caregiver.fullName,
        email: caregiver.email,
      },
    });
  } catch (error: any) {
    console.error("Error deleting caregiver:", error);

    // Handle Prisma errors
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error: "Cannot delete caregiver due to existing relationships",
          details: error.meta,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        error: "Failed to delete caregiver",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

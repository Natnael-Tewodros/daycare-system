import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const caregiverId = parseInt(id);
        const body = await req.json();
        const { assignedRoomId, ...otherData } = body;

        if (isNaN(caregiverId)) {
            return NextResponse.json(
                { error: "Invalid caregiver ID" },
                { status: 400 }
            );
        }

        // Prepare update data
        const updateData: any = { ...otherData };

        // Handle room assignment specifically
        if (assignedRoomId !== undefined) {
            updateData.assignedRoomId = assignedRoomId === null ? null : parseInt(assignedRoomId);
        }

        const updatedCaregiver = await prisma.caregiver.update({
            where: { id: caregiverId },
            data: updateData,
            include: {
                assignedRoom: true
            }
        });

        return NextResponse.json(updatedCaregiver);
    } catch (error) {
        console.error("Error updating caregiver:", error);
        return NextResponse.json(
            { error: "Failed to update caregiver" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const caregiverId = parseInt(id);

        if (isNaN(caregiverId)) {
            return NextResponse.json(
                { error: "Invalid caregiver ID" },
                { status: 400 }
            );
        }

        await prisma.caregiver.delete({
            where: { id: caregiverId }
        });

        return NextResponse.json({ message: "Caregiver deleted successfully" });
    } catch (error) {
        console.error("Error deleting caregiver:", error);
        return NextResponse.json(
            { error: "Failed to delete caregiver" },
            { status: 500 }
        );
    }
}

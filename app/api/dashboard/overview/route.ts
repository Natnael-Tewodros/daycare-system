import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [totalChildren, totalCaregivers, totalOrganizations] = await Promise.all([
      prisma.child.count(),
      prisma.caregiver.count(),
      prisma.organization.count()
    ]);

    // Optional: count today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todaysAttendance = await prisma.attendance.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    // Count pending enrollment requests
    const pendingEnrollmentRequests = await prisma.enrollmentRequest.count({
      where: {
        status: 'pending',
      },
    });

    return NextResponse.json({
      totalChildren,
      totalServants: totalCaregivers, // Alias for backward compatibility
      totalCaregivers, // Also include the new name
      totalOrganizations,
      todaysAttendance,
      pendingEnrollmentRequests,
    });
  } catch (error) {
    console.error("Overview Error:", error);
    return NextResponse.json({ error: "Failed to fetch overview" }, { status: 500 });
  }
}

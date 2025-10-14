import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const totalChildren = await prisma.child.count();
    const totalServants = await prisma.servant.count();
    const totalOrganizations = await prisma.organization.count();

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

    return NextResponse.json({
      totalChildren,
      totalServants,
      totalOrganizations,
      todaysAttendance,
    });
  } catch (error) {
    console.error("Overview Error:", error);
    return NextResponse.json({ error: "Failed to fetch overview" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgParam = searchParams.get("organizationId");
    const orgId =
      orgParam && !Number.isNaN(Number(orgParam))
        ? Number(orgParam)
        : undefined;

    // Fetch children optionally scoped to organization
    const children = await prisma.child.findMany({
      where: orgId ? { organizationId: orgId } : {},
      select: {
        gender: true,
      },
    });

    // Count by gender
    const genderCount = children.reduce((acc, child) => {
      const gender = (child.gender || "").toLowerCase();
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate total and percentages
    const total = children.length;
    const result = Object.entries(genderCount).map(([gender, count]) => ({
      gender: gender.charAt(0).toUpperCase() + gender.slice(1),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching children by gender report:", error);
    return NextResponse.json(
      { error: "Failed to fetch children by gender report" },
      { status: 500 }
    );
  }
}

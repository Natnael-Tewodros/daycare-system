import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        rooms: {
          include: {
            children: true,
            servants: true,
          },
        },
      },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Fetch Organizations Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

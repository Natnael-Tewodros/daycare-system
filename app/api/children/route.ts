import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    console.log("GET /api/children - employeeId query param:", employeeId); // Debug log

    // Temporarily fetch all to test if data exists; re-enable filter once confirmed
    const whereClause = {}; // { parentName: employeeId } // Uncomment after verifying data

    const children = await prisma.child.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        room: true,
        servant: true,
        attendances: true,
      },
    });

    console.log("Fetched children count:", children.length); // Debug log
    console.log("Sample child (if any):", children[0] || "No children"); // Debug log

    return NextResponse.json(children);
  } catch (err) {
    console.error("Prisma error in GET /api/children:", err);
    return NextResponse.json({ error: "Failed to fetch children" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Extract text fields
    const idOneToMoney = formData.get("idOneToMoney") as string; // Extract for logging/filtering, but not saved (add to schema if needed)
    const fullName = formData.get("fullName") as string;
    const parentName = formData.get("parentName") as string;
    const option = formData.get("option") as string;
    const relationship = formData.get("relationship") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const gender = formData.get("gender") as string;

    // Extract file fields (store names/URLs; TODO: upload to storage like S3/Vercel Blob)
    const officialDocumentFile = formData.get("officialDocument") as File | null;
    // Note: Schema lacks officialDocument; mapping to medicalReport for now (or add field to schema)
    const childInformationDocFile = formData.get("childInformationDoc") as File | null;
    const medicalReportFile = officialDocumentFile || childInformationDocFile;
    const medicalReport = medicalReportFile ? medicalReportFile.name : null;

    const profilePicFile = formData.get("profilePic") as File | null;
    const profileImage = profilePicFile ? profilePicFile.name : null;

    // Log form data for debugging (remove in production)
    console.log("Form data received:", {
      idOneToMoney,
      fullName,
      parentName,
      option,
      relationship,
      dateOfBirth,
      gender,
      profileImage,
      medicalReport,
    });

    if (!fullName || !parentName || !option || !relationship || !dateOfBirth || !gender) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If relationship is "other", require officialDocument (now checked via medicalReport presence)
    if (relationship === "other" && !medicalReport) {
      return NextResponse.json({ error: "Official document required for 'Other' relationship" }, { status: 400 });
    }

    const child = await prisma.child.create({
      data: {
        fullName,
        parentName,
        option,
        relationship,
        profileImage: profileImage || null,
        medicalReport: medicalReport || null,
        // roomId and servantId: set if provided via formData.get("roomId") etc., otherwise null
        dateOfBirth: new Date(dateOfBirth),
        gender,
      },
      include: {
        room: true,
        servant: true,
        attendances: true,
      },
    });

    console.log("Created child:", child); // Debug log

    return NextResponse.json(child, { status: 201 });
  } catch (err) {
    console.error("Prisma error in POST /api/children:", err);
    return NextResponse.json({ error: "Failed to create child" }, { status: 500 });
  }
}
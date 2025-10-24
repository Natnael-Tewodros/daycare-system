// app/api/registerAll/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type Body = {
  organization: {
    name: string;
    type?: string;
  };
  user: {
    name: string;
    email: string;
    password: string;
    role?: string;
  };
  servant: {
    fullName: string;
    email?: string;
    phone?: string;
    relationship?: string;
    medicalReport?: string | null;
  };
  child: {
    fullName: string;
    parentName?: string;
    option?: string;
    relationship?: string;
    dateOfBirth?: string;
    gender?: string;
    profileImage?: string | null;
    medicalReport?: string | null;
  };
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();

    // Basic validation
    if (!body.organization?.name) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }
    if (!body.user?.name || !body.user?.email || !body.user?.password) {
      return NextResponse.json({ error: "User name, email and password are required" }, { status: 400 });
    }
    if (!body.servant?.fullName) {
      return NextResponse.json({ error: "Servant fullName is required" }, { status: 400 });
    }
    if (!body.child?.fullName) {
      return NextResponse.json({ error: "Child fullName is required" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(body.user.password, 10);

    // Use a transaction so everything is atomic
    const result = await prisma.$transaction(async (tx) => {
      // 1) create organization
      const org = await tx.organization.create({
        data: { 
          name: body.organization.name,
          type: (body.organization.type as any) || 'INSA' // Default to INSA if not provided
        },
      });

      // 2) create rooms for this organization with proper class names
      const infantRoom = await tx.room.create({
        data: {
          name: "Infant",
          ageRange: "0 months - 18 months",
          organizationId: org.id,
        },
      });

      const toddlerRoom = await tx.room.create({
        data: {
          name: "Toddler", 
          ageRange: "18 months - 3 years",
          organizationId: org.id,
        },
      });

      const niceRoom = await tx.room.create({
        data: {
          name: "Nice",
          ageRange: "3 years - 5 years", 
          organizationId: org.id,
        },
      });

      // 3) create user (employee)
      const user = await tx.user.create({
        data: {
          id: crypto.randomUUID(),
          name: body.user.name,
          email: body.user.email,
          password: hashed,
          role: body.user.role ?? "employee",
        },
      });

      // 4) create servant and assign to defaultRoom
      const servant = await tx.servant.create({
        data: {
          fullName: body.servant.fullName,
          email: body.servant.email ?? `${body.servant.fullName.replace(/\s+/g, "").toLowerCase()}@example.com`,
          phone: body.servant.phone ?? "",
          medicalReport: body.servant.medicalReport ?? null,
          assignedRoomId: infantRoom.id,
          site: 'HEADOFFICE', // Default site
          organizationType: 'INSA', // Default organization type
        },
      });

      // 5) create child and assign to the servant and defaultRoom
      const child = await tx.child.create({
        data: {
          fullName: body.child.fullName,
          parentName: body.child.parentName ?? "",
          option: body.child.option ?? "",
          relationship: (body.child.relationship as any) ?? "OTHER",
          dateOfBirth: body.child.dateOfBirth ? new Date(body.child.dateOfBirth) : new Date(),
          gender: (body.child.gender as any) ?? "OTHER",
          profilePic: body.child.profileImage ?? null,
          childInfoFile: body.child.medicalReport ?? null,
          organizationId: org.id,
          roomId: infantRoom.id,
          servantId: servant.id,
          site: 'HEADOFFICE', // Default site
        },
      });

      return { org, defaultRoom, user: { id: user.id, name: user.name, email: user.email, role: user.role }, servant, child };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("registerAll error:", err);
    return NextResponse.json({ error: "Failed to register data" }, { status: 500 });
  }
}

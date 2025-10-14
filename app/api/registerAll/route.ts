// app/api/registerAll/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type Body = {
  organization: {
    name: string;
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
        data: { name: body.organization.name },
      });

      // 2) create a default room for this organization (so we can link servants/children)
      const defaultRoom = await tx.room.create({
        data: {
          name: "Default Room",
          ageRange: "Unspecified",
          organizationId: org.id,
        },
      });

      // 3) create user (employee)
      const user = await tx.user.create({
        data: {
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
          relationship: body.servant.relationship ?? "",
          medicalReport: body.servant.medicalReport ?? null,
          assignedRoomId: defaultRoom.id,
        },
      });

      // 5) create child and assign to the servant and defaultRoom
      const child = await tx.child.create({
        data: {
          fullName: body.child.fullName,
          parentName: body.child.parentName ?? "",
          option: body.child.option ?? "",
          relationship: body.child.relationship ?? "",
          dateOfBirth: body.child.dateOfBirth ? new Date(body.child.dateOfBirth) : new Date(),
          gender: body.child.gender ?? "",
          profileImage: body.child.profileImage ?? null,
          medicalReport: body.child.medicalReport ?? null,
          roomId: defaultRoom.id,
          servantId: servant.id,
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

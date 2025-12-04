import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest, { params }: { params: any }) {
  try {
    const { password } = await request.json();
    const { id } = await params;
    const userId = id;

    if (!password || password.trim().length < 6) {
      return NextResponse.json(
        {
          error: "Password must be at least 6 characters long",
        },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password.trim(), 12);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user password:", error);
    return NextResponse.json(
      {
        error: "Failed to update password",
      },
      { status: 500 }
    );
  }
}

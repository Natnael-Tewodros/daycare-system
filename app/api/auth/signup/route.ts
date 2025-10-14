import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  console.log('Signup endpoint hit');
  console.log('Request URL:', req.url);
  
  // Clean up the URL by removing any trailing newlines or spaces
  const url = new URL(req.url);
  if (url.pathname.endsWith('%0A')) {
    url.pathname = url.pathname.replace(/%0A$/, '');
    return NextResponse.redirect(url);
  }
  try {
    // Parse JSON body
    const { name, email, password } = await req.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "admin", // default role
      },
    });

    // Return created user (without password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { 
        error: "Something went wrong",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

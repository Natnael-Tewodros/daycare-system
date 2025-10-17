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
    const body = await req.json();
    const idInput = typeof body?.id === 'string' ? body.id : '';
    const nameInput = typeof body?.name === 'string' ? body.name : '';
    const usernameInput = typeof body?.username === 'string' ? body.username : '';
    const emailInput = typeof body?.email === 'string' ? body.email : '';
    const passwordInput = typeof body?.password === 'string' ? body.password : '';

    const id = idInput.trim();
    const name = nameInput.trim();
    const username = usernameInput.trim() || null;
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    // Validate input
    if (!id || !name || !email || !password) {
      return NextResponse.json(
        { error: "ID, name, email, and password are required" },
        { status: 400 }
      );
    }

    // Basic id validation (alphanumeric, dashes/underscores allowed)
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
      return NextResponse.json(
        { error: "ID must be alphanumeric (dashes/underscores allowed), up to 64 chars" },
        { status: 400 }
      );
    }

    // Check if user already exists by id, email, or username
    const existingById = await prisma.user.findUnique({ where: { id } });
    if (existingById) {
      return NextResponse.json(
        { error: "ID already exists" },
        { status: 400 }
      );
    }

    const existingByEmail = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (existingByEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    if (username) {
      const existingByUsername = await prisma.user.findFirst({ where: { username: { equals: username, mode: 'insensitive' } } });
      if (existingByUsername) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        id,
        name,
        username,
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

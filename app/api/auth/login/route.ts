import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Pages send 'email' field that may contain email or username
    const emailOrUsernameInput = typeof body?.email === "string" ? body.email : (typeof body?.username === 'string' ? body.username : "");
    const passwordInput = typeof body?.password === "string" ? body.password : "";

    const identifier = emailOrUsernameInput.trim();
    const password = passwordInput.trim();

    if (!identifier || !password) {
      return NextResponse.json({ error: "Email/Username and password are required" }, { status: 400 });
    }

    // Try to find by email (case-insensitive) OR username (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier.toLowerCase(), mode: 'insensitive' } },
          { username: { equals: identifier, mode: 'insensitive' } },
        ],
      },
    });
    if (!user) {
      console.warn("Login failed: user not found for identifier", identifier);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn("Login failed: wrong password for userId", user.id);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    // For demo: set a lightweight cookie with userId so profile endpoints can read it
    const res = NextResponse.json({ message: "Login successful", user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role } });
    res.cookies.set("userId", user.id, { path: "/", httpOnly: false, sameSite: 'lax' });
    return res;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

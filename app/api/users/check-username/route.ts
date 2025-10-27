import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { 
        username: { equals: username.trim(), mode: 'insensitive' },
        role: 'PARENT' // Only check for parent users
      },
      select: { id: true, name: true, username: true }
    });

    return NextResponse.json({ 
      exists: !!existingUser,
      user: existingUser || null
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({ error: 'Failed to check username' }, { status: 500 });
  }
}

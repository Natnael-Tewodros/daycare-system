import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// NOTE: This demo assumes the client sends userId in a header or cookie.
// For production, integrate proper auth/session and read from it.

export async function GET(request: NextRequest) {
  try {
    const userIdHeader = request.headers.get('x-user-id');
    let userId = userIdHeader || request.cookies.get('userId')?.value || '';
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } as any });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const anyUser = user as any;
    const safeUser = {
      id: anyUser.id,
      name: anyUser.name,
      username: anyUser.username ?? null,
      email: anyUser.email,
      role: anyUser.role,
      profileImage: anyUser.profileImage ?? null,
      createdAt: anyUser.createdAt,
      updatedAt: anyUser.updatedAt,
    };
    return NextResponse.json(safeUser);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userIdHeader = request.headers.get('x-user-id');
    let userId = userIdHeader || request.cookies.get('userId')?.value || '';
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string };

    const updates: any = {};

    if (newPassword) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      const user = await prisma.user.findUnique({ where: { id: userId } as any });
      if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    try {
      await prisma.user.update({ where: { id: userId } as any, data: updates });
    } catch (e: any) {
      // No unique fields now; log and return generic error
      console.error('Profile update error:', e);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Return fresh user state
    const refreshed = await prisma.user.findUnique({ where: { id: userId } as any });
    if (!refreshed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const anyRef = refreshed as any;
    const safeRefreshed = {
      id: anyRef.id,
      name: anyRef.name,
      username: anyRef.username ?? null,
      email: anyRef.email,
      role: anyRef.role,
      profileImage: anyRef.profileImage ?? null,
      createdAt: anyRef.createdAt,
      updatedAt: anyRef.updatedAt,
    };
    return NextResponse.json(safeRefreshed);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}



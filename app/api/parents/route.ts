import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all parents (for admin use)
export async function GET(request: NextRequest) {
  try {
    const parents = await prisma.user.findMany({
      where: { role: 'PARENT' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        children: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(parents);
  } catch (error) {
    console.error('Error fetching parents:', error);
    return NextResponse.json({ error: 'Failed to fetch parents' }, { status: 500 });
  }
}

// Get parent by email (for lookup)
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const parent = await prisma.user.findFirst({
      where: { 
        email: { equals: email, mode: 'insensitive' },
        role: 'PARENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        children: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            organization: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    return NextResponse.json(parent);
  } catch (error) {
    console.error('Error fetching parent:', error);
    return NextResponse.json({ error: 'Failed to fetch parent' }, { status: 500 });
  }
}


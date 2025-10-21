import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find children by parent email
    const children = await prisma.child.findMany({
      where: {
        parentEmail: { equals: email, mode: 'insensitive' },
        parentPassword: password
      },
      include: {
        organization: true,
        room: true,
        servant: true,
        attendances: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (children.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get parent info from first child (all children should have same parent info)
    const firstChild = children[0];
    const parentInfo = {
      name: firstChild.parentName,
      email: firstChild.parentEmail,
      children: children.map(child => ({
        ...child,
        dateOfBirth: child.dateOfBirth.toISOString(),
        createdAt: child.createdAt.toISOString(),
        updatedAt: child.updatedAt.toISOString(),
        attendances: child.attendances.map(att => ({
          ...att,
          checkInTime: att.checkInTime?.toISOString(),
          checkOutTime: att.checkOutTime?.toISOString(),
          createdAt: att.createdAt.toISOString()
        })),
        reports: child.reports.map(rep => ({
          ...rep,
          createdAt: rep.createdAt.toISOString()
        }))
      }))
    };

    return NextResponse.json({
      success: true,
      parent: parentInfo
    });

  } catch (error) {
    console.error('Parent login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

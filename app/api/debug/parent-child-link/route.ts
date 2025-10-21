import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentEmail = searchParams.get('parentEmail');
    const childName = searchParams.get('childName');

    if (!parentEmail || !childName) {
      return NextResponse.json({ 
        error: 'Both parentEmail and childName are required' 
      }, { status: 400 });
    }

    // Find parent by email
    const parent = await prisma.user.findFirst({
      where: { 
        email: { equals: parentEmail, mode: 'insensitive' },
        role: 'PARENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        children: {
          select: {
            id: true,
            fullName: true,
            parentId: true
          }
        }
      }
    });

    // Find child by name
    const child = await prisma.child.findFirst({
      where: { 
        fullName: { equals: childName, mode: 'insensitive' }
      },
      select: {
        id: true,
        fullName: true,
        parentId: true,
        parentName: true,
        parent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      parent: parent || null,
      child: child || null,
      isLinked: parent && child && parent.id === child.parentId,
      diagnosis: {
        parentExists: !!parent,
        childExists: !!child,
        parentHasChildren: parent ? parent.children.length > 0 : false,
        childHasParent: child ? !!child.parentId : false,
        emailsMatch: parent && child ? parent.email.toLowerCase() === child.parentName?.toLowerCase() : false
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Failed to debug parent-child link' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { parentEmail, childName } = await request.json();

    if (!parentEmail || !childName) {
      return NextResponse.json({ 
        error: 'Both parentEmail and childName are required' 
      }, { status: 400 });
    }

    // Find parent by email
    const parent = await prisma.user.findFirst({
      where: { 
        email: { equals: parentEmail, mode: 'insensitive' },
        role: 'PARENT'
      }
    });

    if (!parent) {
      return NextResponse.json({ 
        error: 'Parent not found with that email' 
      }, { status: 404 });
    }

    // Find child by name
    const child = await prisma.child.findFirst({
      where: { 
        fullName: { equals: childName, mode: 'insensitive' }
      }
    });

    if (!child) {
      return NextResponse.json({ 
        error: 'Child not found with that name' 
      }, { status: 404 });
    }

    // Link child to parent
    const updatedChild = await prisma.child.update({
      where: { id: child.id },
      data: { parentId: parent.id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully linked child "${childName}" to parent "${parent.name}"`,
      child: updatedChild
    });

  } catch (error) {
    console.error('Link error:', error);
    return NextResponse.json({ error: 'Failed to link parent and child' }, { status: 500 });
  }
}

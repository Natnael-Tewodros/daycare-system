import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = parseInt(params.id);
    const { name, type } = await request.json();

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if another organization with same name exists (excluding current one)
    const duplicateOrg = await prisma.organization.findFirst({
      where: { 
        name: { equals: name, mode: 'insensitive' },
        id: { not: organizationId }
      }
    });

    if (duplicateOrg) {
      return NextResponse.json({ error: 'Organization with this name already exists' }, { status: 409 });
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: name.trim(),
        type: type as any
      },
      include: {
        children: true,
        rooms: true
      }
    });

    return NextResponse.json({
      id: updatedOrganization.id,
      name: updatedOrganization.name,
      type: updatedOrganization.type,
      childrenCount: updatedOrganization.children.length,
      children: updatedOrganization.children,
      rooms: updatedOrganization.rooms,
      createdAt: updatedOrganization.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const organizationId = parseInt(params.id);

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        children: true,
        rooms: true
      }
    });

    if (!existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if organization has children or rooms
    if (existingOrg.children.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete organization with enrolled children. Please reassign children first.' 
      }, { status: 400 });
    }

    if (existingOrg.rooms.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete organization with assigned rooms. Please reassign rooms first.' 
      }, { status: 400 });
    }

    await prisma.organization.delete({
      where: { id: organizationId }
    });

    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
  }
}

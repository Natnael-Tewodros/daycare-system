import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all children with their organization
    const children = await prisma.child.findMany({
      include: {
        organization: true,
      },
    });

    // Count by organization
    const organizationCount = children.reduce((acc, child) => {
      const orgName = child.organization.name;
      acc[orgName] = (acc[orgName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate total and percentages
    const total = children.length;
    const result = Object.entries(organizationCount).map(([organization, count]) => ({
      organization,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching children by organization report:', error);
    return NextResponse.json({ error: 'Failed to fetch children by organization report' }, { status: 500 });
  }
}

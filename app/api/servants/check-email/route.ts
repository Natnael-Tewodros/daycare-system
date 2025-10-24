import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const excludeId = searchParams.get('excludeId');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const whereClause: any = { email };
    if (excludeId) {
      whereClause.id = { not: parseInt(excludeId) };
    }

    const existingServant = await prisma.servant.findFirst({
      where: whereClause,
      select: { id: true }
    });

    return NextResponse.json({ exists: !!existingServant });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json({ error: 'Failed to check email' }, { status: 500 });
  }
}

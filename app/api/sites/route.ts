import { NextResponse } from 'next/server';

// Get all available sites
export async function GET() {
  try {
    // Return the available sites from the enum
    const sites = [
      { id: 'INSA', name: 'INSA', description: 'INSA Site' },
      { id: 'OPERATION', name: 'Operation', description: 'Operation Site' }
    ];

    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { PrismaClient, OrganizationType } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Log all form data keys and values for debugging
    console.log('Form data received:');
    const formDataObj: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      formDataObj[key] = value instanceof File ? `File: ${value.name}` : value;
      console.log(`${key}:`, formDataObj[key]);
    }
    
    // Extract form data with validation
    const fullName = formData.get('fullName')?.toString().trim();
    const email = formData.get('email')?.toString().trim() || null;
    const phone = formData.get('phone')?.toString().trim();
    const assignedRoomId = formData.get('assignedRoomId')?.toString() || 'none';
    const site = formData.get('site')?.toString() as 'HEADOFFICE' | 'OPERATION' | null;
    const organizationType = formData.get('organizationType')?.toString() as OrganizationType;
    const medicalReportFile = formData.get('medicalReportFile') as File | null;

    // Validate required fields - only email is required
    const errors: Record<string, string> = {};
    if (!email) errors.email = 'Email is required';
    
    if (Object.keys(errors).length > 0) {
      console.error('Validation errors:', errors);
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation failed',
          details: errors
        },
        { status: 400 }
      );
    }

    try {
      // Handle file upload if present
      let medicalReportPath = null;
      if (medicalReportFile) {
        // In a real app, you'd upload this to a file storage service
        // For now, we'll just store the file name
        medicalReportPath = medicalReportFile.name;
      }

      // Convert assignedRoomId to number if it's not 'none'
      const roomId = assignedRoomId === 'none' ? null : parseInt(assignedRoomId, 10);
      
      // Create caregiver in database
      const caregiver = await prisma.caregiver.create({
        data: {
          fullName: fullName || null,
          email: email!,
          phone: phone || null,
          medicalReport: medicalReportPath,
          assignedRoomId: roomId,
          organizationType: organizationType ? (organizationType as OrganizationType) : null,
          siteId: site ? parseInt(site, 10) : null,
        },
      });

      return NextResponse.json({
        success: true,
        data: caregiver
      }, { status: 201 });
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to create caregiver',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating caregiver:', error);
    return NextResponse.json(
      { error: 'Failed to create caregiver' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const caregivers = await prisma.caregiver.findMany({
      include: {
        assignedRoom: true,
        site: true,
      },
    });
    return NextResponse.json(caregivers);
  } catch (error) {
    console.error('Error fetching caregivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch caregivers' },
      { status: 500 }
    );
  }
}

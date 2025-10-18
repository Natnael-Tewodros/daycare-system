import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Get all children with their related data
    const children = await prisma.child.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            ageRange: true,
          },
        },
      },
    });

    // Calculate total children
    const totalChildren = children.length;

    // Group by gender
    const byGender = {
      male: children.filter(c => c.gender === 'MALE').length,
      female: children.filter(c => c.gender === 'FEMALE').length,
      other: children.filter(c => c.gender === 'OTHER').length,
    };

    // Group by organization
    const organizationMap = new Map();
    children.forEach(child => {
      const orgName = child.organization.name;
      if (organizationMap.has(orgName)) {
        organizationMap.set(orgName, organizationMap.get(orgName) + 1);
      } else {
        organizationMap.set(orgName, 1);
      }
    });

    const byOrganization = Array.from(organizationMap.entries()).map(([name, count]) => ({
      organizationName: name,
      count,
      percentage: totalChildren > 0 ? (count / totalChildren) * 100 : 0,
    })).sort((a, b) => b.count - a.count);

    // Group by age groups
    const currentDate = new Date();
    const ageGroups = new Map();
    
    children.forEach(child => {
      const age = currentDate.getFullYear() - child.dateOfBirth.getFullYear();
      const monthDiff = currentDate.getMonth() - child.dateOfBirth.getMonth();
      const actualAge = monthDiff < 0 ? age - 1 : age;
      
      let ageGroup;
      if (actualAge < 2) ageGroup = "0-2 years";
      else if (actualAge < 4) ageGroup = "2-4 years";
      else if (actualAge < 6) ageGroup = "4-6 years";
      else if (actualAge < 8) ageGroup = "6-8 years";
      else ageGroup = "8+ years";
      
      if (ageGroups.has(ageGroup)) {
        ageGroups.set(ageGroup, ageGroups.get(ageGroup) + 1);
      } else {
        ageGroups.set(ageGroup, 1);
      }
    });

    const byAgeGroup = Array.from(ageGroups.entries()).map(([ageGroup, count]) => ({
      ageGroup,
      count,
    })).sort((a, b) => {
      // Sort by age range
      const getAgeValue = (ageStr: string) => {
        const match = ageStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      return getAgeValue(a.ageGroup) - getAgeValue(b.ageGroup);
    });

    // Group by site
    const bySite = {
      INSA: children.filter(c => c.site === 'INSA').length,
      OPERATION: children.filter(c => c.site === 'OPERATION').length,
    };

    // Group by relationship
    const byRelationship = {
      FATHER: children.filter(c => c.relationship === 'FATHER').length,
      MOTHER: children.filter(c => c.relationship === 'MOTHER').length,
      OTHER: children.filter(c => c.relationship === 'OTHER').length,
    };

    const report = {
      totalChildren,
      byGender,
      byOrganization,
      byAgeGroup,
      bySite,
      byRelationship,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching children analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch children analytics" },
      { status: 500 }
    );
  }
}


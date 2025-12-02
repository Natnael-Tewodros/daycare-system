import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getYearRanges(year?: number) {
  const now = new Date();
  const y =
    typeof year === "number" && !Number.isNaN(year) ? year : now.getFullYear();
  const thisYearStart = new Date(y, 0, 1, 0, 0, 0, 0);
  const nextYearStart = new Date(y + 1, 0, 1, 0, 0, 0, 0);
  const lastYearStart = new Date(y - 1, 0, 1, 0, 0, 0, 0);
  const lastYearEnd = thisYearStart;
  return { thisYearStart, nextYearStart, lastYearStart, lastYearEnd, year: y };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const orgParam = searchParams.get("organizationId");
    const orgId =
      orgParam && !Number.isNaN(Number(orgParam))
        ? Number(orgParam)
        : undefined;
    const y = yearParam ? Number.parseInt(yearParam, 10) : undefined;
    const { thisYearStart, nextYearStart, lastYearStart, lastYearEnd, year } =
      getYearRanges(y);

    // Build base where filter (optional organization scope)
    const baseWhere: any = {};
    if (orgId) baseWhere.organizationId = orgId;

    // Current children (not terminated)
    const currentCount = await prisma.child.count({
      where: {
        ...baseWhere,
        NOT: {
          approvalStatus: {
            startsWith: "terminated",
            mode: "insensitive" as any,
          },
        },
      },
    });

    // Children who left last year (terminated and updated last year)
    const leftLastYear = await prisma.child.count({
      where: {
        ...baseWhere,
        approvalStatus: {
          startsWith: "terminated",
          mode: "insensitive" as any,
        },
        updatedAt: {
          gte: lastYearStart,
          lt: lastYearEnd,
        },
      },
    });

    // Total children created this year and last year (join counts)
    const totalThisYear = await prisma.child.count({
      where: {
        ...baseWhere,
        createdAt: { gte: thisYearStart, lt: nextYearStart },
      },
    });
    const totalLastYear = await prisma.child.count({
      where: {
        ...baseWhere,
        createdAt: { gte: lastYearStart, lt: lastYearEnd },
      },
    });

    // Terminated list for selected year
    const terminatedThisYearRaw = await prisma.child.findMany({
      where: {
        ...baseWhere,
        approvalStatus: {
          startsWith: "terminated",
          mode: "insensitive" as any,
        },
        updatedAt: {
          gte: thisYearStart,
          lt: nextYearStart,
        },
      },
      include: {
        organization: true,
        site: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    const terminatedInYear = terminatedThisYearRaw.map((c) => {
      const status = String((c as any).approvalStatus || "");
      const parts = status.split(":");
      const rawReason = (parts[1] || "UNKNOWN").toUpperCase();
      const notes = parts.length > 2 ? parts.slice(2).join(":") : "";
      const reasonMap: Record<string, string> = {
        GRADUATED: "Graduated",
        PARENT_LEFT_COMPANY: "Parent left company",
        TRANSFERRED: "Transferred",
        DECEASED: "Death",
        OTHER: "Other",
        UNKNOWN: "Unknown",
      };
      const reason = reasonMap[rawReason] || rawReason;
      return {
        id: c.id,
        fullName: c.fullName,
        organization: c.organization?.name || "Unassigned",
        site: c.site?.name || "Unassigned",
        updatedAt: c.updatedAt,
        reason,
        notes,
      };
    });

    // Group by organization
    const byOrgGroup = await prisma.child.groupBy({
      by: ["organizationId"],
      _count: { _all: true },
      where: baseWhere,
    });
    const orgIds = byOrgGroup
      .map((g) => g.organizationId)
      .filter((v): v is number => v != null);
    const orgs = await prisma.organization.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, name: true },
    });
    const orgIdToName = new Map(orgs.map((o) => [o.id, o.name]));
    const byOrganization = byOrgGroup
      .map((g) => ({
        organization: g.organizationId
          ? orgIdToName.get(g.organizationId) || "Unknown"
          : "Unassigned",
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    // Group by site
    const bySiteGroup = await prisma.child.groupBy({
      by: ["siteId"],
      _count: { _all: true },
      where: baseWhere,
    });
    const siteIds = bySiteGroup
      .map((g) => g.siteId)
      .filter((v): v is number => v != null);
    const sites = await prisma.site.findMany({
      where: { id: { in: siteIds } },
      select: { id: true, name: true },
    });
    const siteIdToName = new Map(sites.map((s) => [s.id, s.name]));
    const bySite = bySiteGroup
      .map((g) => ({
        site: g.siteId ? siteIdToName.get(g.siteId) || "Unknown" : "Unassigned",
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      year,
      currentCount,
      leftLastYear,
      byOrganization,
      bySite,
      totalThisYear,
      totalLastYear,
      joinedThisYear: totalThisYear,
      terminatedInYear,
    });
  } catch (error) {
    console.error("Error computing children stats:", error);
    return NextResponse.json(
      { error: "Failed to compute children stats" },
      { status: 500 }
    );
  }
}

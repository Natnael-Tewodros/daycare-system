-- Add report type and date range columns to match Prisma schema
ALTER TABLE "Report"
  ADD COLUMN "reportType" TEXT NOT NULL DEFAULT 'weekly',
  ADD COLUMN "weekStart" TIMESTAMP(3),
  ADD COLUMN "weekEnd" TIMESTAMP(3);

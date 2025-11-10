-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];

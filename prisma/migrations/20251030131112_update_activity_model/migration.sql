-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "parentEmail" TEXT,
ADD COLUMN     "senderType" TEXT NOT NULL DEFAULT 'admin';

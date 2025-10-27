/*
  Warnings:

  - You are about to drop the column `site` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `site` on the `Servant` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[parentEmail]` on the table `Child` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PARENT');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BIRTHDAY', 'HOLIDAY', 'EDUCATIONAL', 'SPORTS', 'CULTURAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('REGISTERED', 'ATTENDED', 'ABSENT', 'CANCELLED');

-- DropIndex
DROP INDEX "public"."EnrollmentRequest_email_key";

-- AlterTable
ALTER TABLE "Activity" ALTER COLUMN "recipients" DROP DEFAULT,
ALTER COLUMN "attachments" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "visibilityDays" INTEGER;

-- AlterTable
ALTER TABLE "Child" DROP COLUMN "site",
ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "enrollmentRequestId" INTEGER,
ADD COLUMN     "parentEmail" TEXT,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "parentPassword" TEXT,
ADD COLUMN     "siteId" INTEGER;

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "type",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Servant" DROP COLUMN "site",
ADD COLUMN     "siteId" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'ADMIN';

-- DropEnum
DROP TYPE "public"."Site";

-- CreateTable
CREATE TABLE "Site" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementView" (
    "id" SERIAL NOT NULL,
    "announcementId" INTEGER NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventType" "EventType" NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipation" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'REGISTERED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "parentEmail" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementView_announcementId_userId_key" ON "AnnouncementView"("announcementId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementView_announcementId_userEmail_key" ON "AnnouncementView"("announcementId", "userEmail");

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipation_childId_eventId_key" ON "EventParticipation"("childId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Child_parentEmail_key" ON "Child"("parentEmail");

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_enrollmentRequestId_fkey" FOREIGN KEY ("enrollmentRequestId") REFERENCES "EnrollmentRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servant" ADD CONSTRAINT "Servant_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementView" ADD CONSTRAINT "AnnouncementView_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipation" ADD CONSTRAINT "EventParticipation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

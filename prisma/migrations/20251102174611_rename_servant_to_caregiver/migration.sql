/*
  Warnings:

  - You are about to drop the column `servantId` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the `Servant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Child" DROP CONSTRAINT "Child_servantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Servant" DROP CONSTRAINT "Servant_assignedRoomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Servant" DROP CONSTRAINT "Servant_siteId_fkey";

-- AlterTable
ALTER TABLE "Child" DROP COLUMN "servantId",
ADD COLUMN     "caregiverId" INTEGER;

-- DropTable
DROP TABLE "public"."Servant";

-- CreateTable
CREATE TABLE "Caregiver" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "medicalReport" TEXT,
    "assignedRoomId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "canTransferRooms" BOOLEAN NOT NULL DEFAULT false,
    "organizationType" "OrganizationType" NOT NULL,
    "siteId" INTEGER,
    "organizationId" INTEGER,

    CONSTRAINT "Caregiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AnnouncementToCaregiver" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AnnouncementToCaregiver_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AnnouncementToRoom" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AnnouncementToRoom_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AnnouncementToCaregiver_B_index" ON "_AnnouncementToCaregiver"("B");

-- CreateIndex
CREATE INDEX "_AnnouncementToRoom_B_index" ON "_AnnouncementToRoom"("B");

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caregiver" ADD CONSTRAINT "Caregiver_assignedRoomId_fkey" FOREIGN KEY ("assignedRoomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caregiver" ADD CONSTRAINT "Caregiver_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caregiver" ADD CONSTRAINT "Caregiver_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnnouncementToCaregiver" ADD CONSTRAINT "_AnnouncementToCaregiver_A_fkey" FOREIGN KEY ("A") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnnouncementToCaregiver" ADD CONSTRAINT "_AnnouncementToCaregiver_B_fkey" FOREIGN KEY ("B") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnnouncementToRoom" ADD CONSTRAINT "_AnnouncementToRoom_A_fkey" FOREIGN KEY ("A") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AnnouncementToRoom" ADD CONSTRAINT "_AnnouncementToRoom_B_fkey" FOREIGN KEY ("B") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

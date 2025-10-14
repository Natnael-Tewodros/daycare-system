/*
  Warnings:

  - You are about to drop the column `relationship` on the `Servant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Servant" DROP COLUMN "relationship",
ADD COLUMN     "canTransferRooms" BOOLEAN NOT NULL DEFAULT false;

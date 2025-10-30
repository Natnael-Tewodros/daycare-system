/*
  Warnings:

  - Made the column `type` on table `Notification` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "message" DROP DEFAULT,
ALTER COLUMN "title" DROP DEFAULT,
ALTER COLUMN "type" SET NOT NULL;

/*
  Warnings:

  - You are about to drop the column `medicalReport` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `Child` table. All the data in the column will be lost.
  - Added the required column `organizationId` to the `Child` table without a default value. This is not possible if the table is not empty.
  - Added the required column `site` to the `Child` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `relationship` on the `Child` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `gender` on the `Child` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `type` to the `Organization` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Relationship" AS ENUM ('FATHER', 'MOTHER', 'OTHER');

-- CreateEnum
CREATE TYPE "Site" AS ENUM ('INSA', 'OPERATION');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('INSA', 'AI', 'MINISTRY_OF_PEACE', 'FINANCE_SECURITY');

-- AlterTable
ALTER TABLE "Child" DROP COLUMN "medicalReport",
DROP COLUMN "profileImage",
ADD COLUMN     "childInfoFile" TEXT,
ADD COLUMN     "organizationId" INTEGER NOT NULL,
ADD COLUMN     "profilePic" TEXT,
ADD COLUMN     "site" "Site" NOT NULL,
DROP COLUMN "relationship",
ADD COLUMN     "relationship" "Relationship" NOT NULL,
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender" NOT NULL;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "type" "OrganizationType" NOT NULL;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

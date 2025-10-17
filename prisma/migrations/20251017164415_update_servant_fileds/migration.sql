/*
  Warnings:

  - Added the required column `organizationType` to the `Servant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `site` to the `Servant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Servant" ADD COLUMN     "organizationType" "OrganizationType" NOT NULL,
ADD COLUMN     "site" "Site" NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- Drop existing Activity table and create new one with recipients and attachments
DROP TABLE IF EXISTS "Activity" CASCADE;

-- Create the Activity table with recipients and attachments
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "recipients" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "attachments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);


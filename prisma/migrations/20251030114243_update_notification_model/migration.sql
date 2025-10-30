-- Add new columns with default values first
ALTER TABLE "Notification" ADD COLUMN "message" TEXT DEFAULT 'New notification';
ALTER TABLE "Notification" ADD COLUMN "title" TEXT DEFAULT 'Notification';
ALTER TABLE "Notification" ADD COLUMN "type" TEXT DEFAULT 'info';

-- Update existing rows with default values
UPDATE "Notification" SET 
  "message" = 'You have a new notification',
  "title" = 'Notification',
  "type" = 'info';

-- Alter columns to be NOT NULL
ALTER TABLE "Notification" ALTER COLUMN "message" SET NOT NULL;
ALTER TABLE "Notification" ALTER COLUMN "title" SET NOT NULL;

-- Make activityId nullable
ALTER TABLE "Notification" ALTER COLUMN "activityId" DROP NOT NULL;

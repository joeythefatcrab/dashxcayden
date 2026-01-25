-- Add description field to DailyTimeLog table
ALTER TABLE "DailyTimeLog" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Add optional PDF attachment URL to lessons (for checksheets etc.)
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "attachmentUrl" TEXT;

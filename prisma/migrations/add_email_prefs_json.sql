-- Add granular email preferences JSON column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailPrefsJson" TEXT NOT NULL DEFAULT '{}';

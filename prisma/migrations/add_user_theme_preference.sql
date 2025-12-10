-- Add theme preference to User table
ALTER TABLE "User" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'light';

-- Add comment to explain the column
COMMENT ON COLUMN "User"."theme" IS 'User theme preference: light, dark, or system';

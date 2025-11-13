-- Add course code and visibility fields to Curriculum table
-- Run this in your Neon SQL console

-- Add courseCode column (unique, optional)
ALTER TABLE "Curriculum"
ADD COLUMN "courseCode" TEXT;

-- Add isPublic column (defaults to true)
ALTER TABLE "Curriculum"
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- Create unique index on courseCode
CREATE UNIQUE INDEX "Curriculum_courseCode_key" ON "Curriculum"("courseCode");

-- Create index for faster lookups
CREATE INDEX "Curriculum_courseCode_idx" ON "Curriculum"("courseCode");

-- Optional: Generate course codes for existing curricula
-- Uncomment the lines below if you have existing curricula that need codes
-- UPDATE "Curriculum" SET "courseCode" = CONCAT(
--   CHR(65 + floor(random() * 26)::int),
--   CHR(65 + floor(random() * 26)::int),
--   CHR(65 + floor(random() * 26)::int),
--   '-',
--   LPAD(floor(random() * 1000)::text, 3, '0')
-- )
-- WHERE "courseCode" IS NULL;

-- ===================================================================
-- ESSAY SUBMISSION TABLE MIGRATION
-- Run this SQL directly in your database provider's UI (Neon/Supabase)
-- ===================================================================

-- Clean up: Drop the table if it exists with wrong structure
DROP TABLE IF EXISTS "EssaySubmission" CASCADE;

-- Step 1: Create EssayStatus enum (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "EssayStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'GRADED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create EssaySubmission table
CREATE TABLE "EssaySubmission" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "EssayStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "aiGrade" INTEGER,
    "aiStrengths" TEXT,
    "aiImprovements" TEXT,
    "aiSummary" TEXT,
    "aiParentNote" TEXT,
    "aiGradedAt" TIMESTAMP(3),
    "grade" INTEGER,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EssaySubmission_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create unique index
CREATE UNIQUE INDEX "EssaySubmission_studentId_itemId_key"
ON "EssaySubmission"("studentId", "itemId");

-- Step 4: Create regular indexes
CREATE INDEX "EssaySubmission_studentId_idx"
ON "EssaySubmission"("studentId");

CREATE INDEX "EssaySubmission_lessonId_idx"
ON "EssaySubmission"("lessonId");

CREATE INDEX "EssaySubmission_itemId_idx"
ON "EssaySubmission"("itemId");

CREATE INDEX "EssaySubmission_status_idx"
ON "EssaySubmission"("status");

CREATE INDEX "EssaySubmission_submittedAt_idx"
ON "EssaySubmission"("submittedAt");

-- Step 5: Add foreign key constraint
ALTER TABLE "EssaySubmission"
ADD CONSTRAINT "EssaySubmission_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Done! The EssaySubmission table is now ready.

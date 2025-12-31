-- CreateEnum for EssayStatus
DO $$ BEGIN
    CREATE TYPE "EssayStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'GRADED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable EssaySubmission
CREATE TABLE IF NOT EXISTS "EssaySubmission" (
    id TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    content TEXT NOT NULL,
    status "EssayStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "aiGrade" INTEGER,
    "aiStrengths" TEXT,
    "aiImprovements" TEXT,
    "aiSummary" TEXT,
    "aiParentNote" TEXT,
    "aiGradedAt" TIMESTAMP(3),
    grade INTEGER,
    feedback TEXT,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EssaySubmission_pkey" PRIMARY KEY (id)
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EssaySubmission_studentId_itemId_key" ON "EssaySubmission"("studentId", "itemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EssaySubmission_studentId_idx" ON "EssaySubmission"("studentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EssaySubmission_lessonId_idx" ON "EssaySubmission"("lessonId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EssaySubmission_itemId_idx" ON "EssaySubmission"("itemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EssaySubmission_status_idx" ON "EssaySubmission"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EssaySubmission_submittedAt_idx" ON "EssaySubmission"("submittedAt");

-- AddForeignKey
ALTER TABLE "EssaySubmission" ADD CONSTRAINT "EssaySubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"(id) ON DELETE CASCADE ON UPDATE CASCADE;

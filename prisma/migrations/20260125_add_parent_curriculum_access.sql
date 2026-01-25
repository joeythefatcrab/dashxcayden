-- Add ParentCurriculumAccess table for controlling which parents can see which curricula
CREATE TABLE IF NOT EXISTS "ParentCurriculumAccess" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "parentId" TEXT NOT NULL,
  "curriculumId" TEXT NOT NULL,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "grantedBy" TEXT,

  CONSTRAINT "ParentCurriculumAccess_parent_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ParentCurriculumAccess_curriculum_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint to prevent duplicate access grants
CREATE UNIQUE INDEX "ParentCurriculumAccess_parentId_curriculumId_key" ON "ParentCurriculumAccess"("parentId", "curriculumId");

-- Create indexes for better query performance
CREATE INDEX "ParentCurriculumAccess_parentId_idx" ON "ParentCurriculumAccess"("parentId");
CREATE INDEX "ParentCurriculumAccess_curriculumId_idx" ON "ParentCurriculumAccess"("curriculumId");

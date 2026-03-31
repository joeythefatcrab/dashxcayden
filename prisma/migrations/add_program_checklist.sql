-- ProgramChecklistItem: individual items from the yearly program checklist
CREATE TABLE IF NOT EXISTS "ProgramChecklistItem" (
  "id"             TEXT NOT NULL,
  "programId"      TEXT NOT NULL,
  "sectionTitle"   TEXT,
  "title"          TEXT NOT NULL,
  "description"    TEXT,
  "itemType"       TEXT NOT NULL DEFAULT 'CHECKBOX',
  "curriculumId"   TEXT,
  "isOptional"     BOOLEAN NOT NULL DEFAULT false,
  "requiresReview" BOOLEAN NOT NULL DEFAULT false,
  "order"          INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProgramChecklistItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProgramChecklistItem_programId_fkey"
    FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProgramChecklistItem_programId_idx" ON "ProgramChecklistItem"("programId");

-- ProgramItemCompletion: tracks each student's completion status per checklist item
CREATE TABLE IF NOT EXISTS "ProgramItemCompletion" (
  "id"           TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "itemId"       TEXT NOT NULL,
  "status"       TEXT NOT NULL DEFAULT 'PENDING',
  "content"      TEXT,
  "adminNote"    TEXT,
  "completedAt"  TIMESTAMP(3),
  "reviewedAt"   TIMESTAMP(3),
  "reviewedById" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProgramItemCompletion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProgramItemCompletion_enrollmentId_itemId_key" UNIQUE ("enrollmentId", "itemId"),
  CONSTRAINT "ProgramItemCompletion_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProgramItemCompletion_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "ProgramChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProgramItemCompletion_enrollmentId_idx" ON "ProgramItemCompletion"("enrollmentId");
CREATE INDEX IF NOT EXISTS "ProgramItemCompletion_itemId_idx"        ON "ProgramItemCompletion"("itemId");

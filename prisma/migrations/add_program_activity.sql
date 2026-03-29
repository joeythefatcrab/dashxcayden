-- Add ProgramActivity table for non-course program items (volunteering, field trips, etc.)
CREATE TABLE IF NOT EXISTS "ProgramActivity" (
  "id"           TEXT NOT NULL,
  "programId"    TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "description"  TEXT,
  "activityType" TEXT NOT NULL DEFAULT 'OTHER',
  "hoursRequired" DOUBLE PRECISION,
  "order"        INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProgramActivity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProgramActivity_programId_fkey"
    FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProgramActivity_programId_idx" ON "ProgramActivity"("programId");

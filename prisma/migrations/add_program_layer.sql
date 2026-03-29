-- Add offline lesson fields to Lesson
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "isOffline" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "lessonType" TEXT NOT NULL DEFAULT 'ONLINE';

-- Program (yearly curriculum plan)
CREATE TABLE IF NOT EXISTS "Program" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "description"  TEXT,
  "academicYear" TEXT NOT NULL,
  "createdById"  TEXT NOT NULL,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Program_createdById_idx" ON "Program"("createdById");
CREATE INDEX IF NOT EXISTS "Program_academicYear_idx" ON "Program"("academicYear");

-- ProgramCourse (courses within a program, ordered)
CREATE TABLE IF NOT EXISTS "ProgramCourse" (
  "id"           TEXT NOT NULL,
  "programId"    TEXT NOT NULL,
  "curriculumId" TEXT NOT NULL,
  "order"        INTEGER NOT NULL DEFAULT 0,
  "isRequired"   BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProgramCourse_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProgramCourse_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE,
  CONSTRAINT "ProgramCourse_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramCourse_programId_curriculumId_key" ON "ProgramCourse"("programId", "curriculumId");
CREATE INDEX IF NOT EXISTS "ProgramCourse_programId_idx" ON "ProgramCourse"("programId");
CREATE INDEX IF NOT EXISTS "ProgramCourse_curriculumId_idx" ON "ProgramCourse"("curriculumId");

-- ProgramEnrollment (students enrolled in a program)
CREATE TABLE IF NOT EXISTS "ProgramEnrollment" (
  "id"          TEXT NOT NULL,
  "programId"   TEXT NOT NULL,
  "studentId"   TEXT NOT NULL,
  "enrolledAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "ProgramEnrollment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProgramEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE,
  CONSTRAINT "ProgramEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProgramEnrollment_programId_studentId_key" ON "ProgramEnrollment"("programId", "studentId");
CREATE INDEX IF NOT EXISTS "ProgramEnrollment_programId_idx" ON "ProgramEnrollment"("programId");
CREATE INDEX IF NOT EXISTS "ProgramEnrollment_studentId_idx" ON "ProgramEnrollment"("studentId");

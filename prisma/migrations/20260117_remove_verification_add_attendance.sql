-- Remove verification fields from DailyTimeLog
ALTER TABLE "DailyTimeLog" DROP COLUMN IF EXISTS "verifiedByParent";
ALTER TABLE "DailyTimeLog" DROP COLUMN IF EXISTS "verifiedAt";
ALTER TABLE "DailyTimeLog" DROP COLUMN IF EXISTS "verifiedBy";

-- Remove verification fields from ExternalActivity
ALTER TABLE "ExternalActivity" DROP COLUMN IF EXISTS "verifiedByParent";
ALTER TABLE "ExternalActivity" DROP COLUMN IF EXISTS "verifiedAt";
ALTER TABLE "ExternalActivity" DROP COLUMN IF EXISTS "verifiedBy";

-- Drop indexes related to verification
DROP INDEX IF EXISTS "DailyTimeLog_verifiedByParent_idx";
DROP INDEX IF EXISTS "ExternalActivity_verifiedByParent_idx";

-- Create DailyAttendance table for auto-tracking attendance
CREATE TABLE "DailyAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint and indexes for DailyAttendance
CREATE UNIQUE INDEX "DailyAttendance_studentId_date_key" ON "DailyAttendance"("studentId", "date");
CREATE INDEX "DailyAttendance_studentId_date_idx" ON "DailyAttendance"("studentId", "date");

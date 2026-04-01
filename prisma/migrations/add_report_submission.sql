-- Add submittedAt to MonthlyReport and notifyOnReportSubmission to User
ALTER TABLE "MonthlyReport" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifyOnReportSubmission" BOOLEAN NOT NULL DEFAULT false;

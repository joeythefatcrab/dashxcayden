-- Add verification tracking fields to DailyTimeLog
ALTER TABLE "DailyTimeLog" ADD COLUMN "verifiedByParent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DailyTimeLog" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "DailyTimeLog" ADD COLUMN "verifiedBy" TEXT;
ALTER TABLE "DailyTimeLog" ADD COLUMN "submittedBy" TEXT;

CREATE INDEX "DailyTimeLog_verifiedByParent_idx" ON "DailyTimeLog"("verifiedByParent");

-- Add verification tracking fields to ExternalActivity
ALTER TABLE "ExternalActivity" ADD COLUMN "verifiedByParent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ExternalActivity" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "ExternalActivity" ADD COLUMN "verifiedBy" TEXT;
ALTER TABLE "ExternalActivity" ADD COLUMN "submittedBy" TEXT;

CREATE INDEX "ExternalActivity_verifiedByParent_idx" ON "ExternalActivity"("verifiedByParent");

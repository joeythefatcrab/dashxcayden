CREATE TABLE IF NOT EXISTS "ReportAttachment" (
  "id"        TEXT NOT NULL,
  "reportId"  TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "size"      INTEGER,
  "mimeType"  TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReportAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReportAttachment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "MonthlyReport"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ReportAttachment_reportId_idx" ON "ReportAttachment"("reportId");

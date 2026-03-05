-- Add paywallExempt flag to Student for pilot users / testers
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "paywallExempt" BOOLEAN NOT NULL DEFAULT false;

-- Add paywall_enabled system setting (true by default)
INSERT INTO "SystemSetting" ("id", "key", "value", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'paywall_enabled', 'true', NOW(), NOW())
ON CONFLICT ("key") DO NOTHING;

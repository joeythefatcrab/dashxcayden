-- Create InviteCode table for single-use, role-preset signup invitations
CREATE TABLE IF NOT EXISTS "InviteCode" (
    "id"             TEXT NOT NULL,
    "code"           TEXT NOT NULL,
    "role"           "Role" NOT NULL,
    "label"          TEXT,
    "createdById"    TEXT NOT NULL,
    "organizationId" TEXT,
    "usedAt"         TIMESTAMP(3),
    "usedByEmail"    TEXT,
    "expiresAt"      TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InviteCode_code_key" ON "InviteCode"("code");
CREATE INDEX IF NOT EXISTS "InviteCode_code_idx" ON "InviteCode"("code");
CREATE INDEX IF NOT EXISTS "InviteCode_createdById_idx" ON "InviteCode"("createdById");
CREATE INDEX IF NOT EXISTS "InviteCode_organizationId_idx" ON "InviteCode"("organizationId");

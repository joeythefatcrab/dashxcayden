-- CreateEnum for InvitationStatus
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateTable StudentInvitation
CREATE TABLE "StudentInvitation" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "studentName" TEXT,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "curriculaIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "StudentInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentInvitation_token_key" ON "StudentInvitation"("token");

-- CreateIndex
CREATE INDEX "StudentInvitation_parentId_idx" ON "StudentInvitation"("parentId");

-- CreateIndex
CREATE INDEX "StudentInvitation_studentEmail_idx" ON "StudentInvitation"("studentEmail");

-- CreateIndex
CREATE INDEX "StudentInvitation_token_idx" ON "StudentInvitation"("token");

-- CreateIndex
CREATE INDEX "StudentInvitation_status_idx" ON "StudentInvitation"("status");

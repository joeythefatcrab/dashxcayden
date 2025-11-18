-- ============================================
-- COMPLETE DATABASE REBUILD
-- ============================================
-- This script rebuilds the entire database from scratch
-- WARNING: This will delete ALL existing data!
-- ============================================

-- DROP EVERYTHING FIRST
DROP TABLE IF EXISTS "Activity" CASCADE;
DROP TABLE IF EXISTS "Attempt" CASCADE;
DROP TABLE IF EXISTS "Enrollment" CASCADE;
DROP TABLE IF EXISTS "GlossaryTerm" CASCADE;
DROP TABLE IF EXISTS "Item" CASCADE;
DROP TABLE IF EXISTS "Lesson" CASCADE;
DROP TABLE IF EXISTS "Unit" CASCADE;
DROP TABLE IF EXISTS "Curriculum" CASCADE;
DROP TABLE IF EXISTS "Student" CASCADE;
DROP TABLE IF EXISTS "StudentInvitation" CASCADE;
DROP TABLE IF EXISTS "DigestLog" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "Account" CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "ItemType" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "InvitationStatus" CASCADE;

-- CREATE ENUMS
CREATE TYPE "Role" AS ENUM ('PARENT', 'STUDENT', 'ADMIN');
CREATE TYPE "ItemType" AS ENUM ('MCQ', 'SHORT_ANSWER', 'ESSAY', 'TRUE_FALSE');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- ============================================
-- CREATE TABLES
-- ============================================

-- Auth.js tables
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- User table WITH adminId for hierarchy
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PARENT',
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "digestFrequency" TEXT NOT NULL DEFAULT 'daily',
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifySms" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumber" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "parentId" TEXT NOT NULL,
    "grade" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "Curriculum" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "provider" TEXT,
    "grade" INTEGER,
    "subject" TEXT,
    "courseCode" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "rawFileUrl" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contentMd" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL DEFAULT 70,
    "order" INTEGER NOT NULL,
    "objectives" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "order" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "choices" JSONB,
    "answerKey" JSONB NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GlossaryTerm" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "derivation" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GlossaryTerm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "progress" JSONB NOT NULL DEFAULT '{}',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "earned" INTEGER NOT NULL,
    "detail" JSONB NOT NULL,
    "timeSpent" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lessonId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DigestLog" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" JSONB NOT NULL,
    CONSTRAINT "DigestLog_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_adminId_idx" ON "User"("adminId");
CREATE INDEX "Student_parentId_idx" ON "Student"("parentId");
CREATE INDEX "Student_userId_idx" ON "Student"("userId");
CREATE INDEX "StudentInvitation_parentId_idx" ON "StudentInvitation"("parentId");
CREATE INDEX "StudentInvitation_studentEmail_idx" ON "StudentInvitation"("studentEmail");
CREATE UNIQUE INDEX "StudentInvitation_token_key" ON "StudentInvitation"("token");
CREATE INDEX "StudentInvitation_token_idx" ON "StudentInvitation"("token");
CREATE INDEX "StudentInvitation_status_idx" ON "StudentInvitation"("status");
CREATE INDEX "Curriculum_createdById_idx" ON "Curriculum"("createdById");
CREATE UNIQUE INDEX "Curriculum_courseCode_key" ON "Curriculum"("courseCode");
CREATE INDEX "Curriculum_courseCode_idx" ON "Curriculum"("courseCode");
CREATE INDEX "Unit_curriculumId_idx" ON "Unit"("curriculumId");
CREATE UNIQUE INDEX "Unit_curriculumId_order_key" ON "Unit"("curriculumId", "order");
CREATE INDEX "Lesson_unitId_idx" ON "Lesson"("unitId");
CREATE UNIQUE INDEX "Lesson_unitId_order_key" ON "Lesson"("unitId", "order");
CREATE INDEX "Item_lessonId_idx" ON "Item"("lessonId");
CREATE UNIQUE INDEX "Item_lessonId_order_key" ON "Item"("lessonId", "order");
CREATE UNIQUE INDEX "GlossaryTerm_term_key" ON "GlossaryTerm"("term");
CREATE INDEX "GlossaryTerm_term_idx" ON "GlossaryTerm"("term");
CREATE UNIQUE INDEX "Enrollment_studentId_curriculumId_key" ON "Enrollment"("studentId", "curriculumId");
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");
CREATE INDEX "Enrollment_curriculumId_idx" ON "Enrollment"("curriculumId");
CREATE INDEX "Attempt_studentId_idx" ON "Attempt"("studentId");
CREATE INDEX "Attempt_lessonId_idx" ON "Attempt"("lessonId");
CREATE INDEX "Attempt_createdAt_idx" ON "Attempt"("createdAt");
CREATE INDEX "Activity_studentId_createdAt_idx" ON "Activity"("studentId", "createdAt");
CREATE INDEX "DigestLog_parentId_sentAt_idx" ON "DigestLog"("parentId", "sentAt");

-- ============================================
-- ADD FOREIGN KEYS
-- ============================================

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- INSERT TEST DATA
-- ============================================

-- Create Admin User
-- Email: admin@homeschool.com / Password: password123
INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt", "digestFrequency", "notifyEmail", "notifySms")
VALUES (
    'admin_001',
    'Admin User',
    'admin@homeschool.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8H.6ueI/MrLT1JXKFQ3LQjxz7qkLa',
    'ADMIN',
    NOW(),
    NOW(),
    'daily',
    true,
    false
);

-- Create Parent Accounts
INSERT INTO "User" (id, name, email, password, role, "adminId", "createdAt", "updatedAt", "digestFrequency", "notifyEmail", "notifySms")
VALUES
    ('parent_001', 'Sarah Smith', 'parent1@homeschool.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8H.6ueI/MrLT1JXKFQ3LQjxz7qkLa', 'PARENT', 'admin_001', NOW(), NOW(), 'daily', true, false),
    ('parent_002', 'Michael Johnson', 'parent2@homeschool.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8H.6ueI/MrLT1JXKFQ3LQjxz7qkLa', 'PARENT', 'admin_001', NOW(), NOW(), 'weekly', true, false),
    ('parent_003', 'Emily Davis', 'parent3@homeschool.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8H.6ueI/MrLT1JXKFQ3LQjxz7qkLa', 'PARENT', 'admin_001', NOW(), NOW(), 'daily', true, false);

-- Create Students
INSERT INTO "Student" (id, name, "parentId", grade, "createdAt", "updatedAt")
VALUES
    ('student_001', 'Emma Smith', 'parent_001', 8, NOW(), NOW()),
    ('student_002', 'Noah Smith', 'parent_001', 6, NOW(), NOW()),
    ('student_003', 'Olivia Johnson', 'parent_002', 7, NOW(), NOW()),
    ('student_004', 'Liam Davis', 'parent_003', 5, NOW(), NOW()),
    ('student_005', 'Sophia Davis', 'parent_003', 9, NOW(), NOW());

-- ============================================
-- VERIFY
-- ============================================

DO $$
DECLARE
    admin_count INTEGER;
    parent_count INTEGER;
    student_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM "User" WHERE role = 'ADMIN';
    SELECT COUNT(*) INTO parent_count FROM "User" WHERE role = 'PARENT';
    SELECT COUNT(*) INTO student_count FROM "Student";

    RAISE NOTICE '✅ Database rebuild complete!';
    RAISE NOTICE 'Admins: %', admin_count;
    RAISE NOTICE 'Parents: %', parent_count;
    RAISE NOTICE 'Students: %', student_count;

    IF admin_count = 0 THEN
        RAISE EXCEPTION 'ERROR: Admin was not created!';
    END IF;
END $$;

-- ============================================
-- SUCCESS! Test accounts:
-- ============================================
-- Admin:    admin@homeschool.com    / password123
-- Parent 1: parent1@homeschool.com  / password123 (2 students)
-- Parent 2: parent2@homeschool.com  / password123 (1 student)
-- Parent 3: parent3@homeschool.com  / password123 (2 students)
-- ============================================

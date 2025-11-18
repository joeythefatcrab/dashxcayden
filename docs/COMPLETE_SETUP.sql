-- ============================================
-- COMPLETE DATABASE SETUP - RUN ALL OF THIS
-- ============================================
-- This script does everything in the correct order:
-- 1. Adds the adminId column (migration)
-- 2. Clears old test data
-- 3. Creates fresh admin and parent accounts
-- ============================================

-- STEP 1: Add adminId column (migration)
-- ============================================
DO $$
BEGIN
    -- Add adminId column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'User' AND column_name = 'adminId'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "adminId" TEXT;
        CREATE INDEX "User_adminId_idx" ON "User"("adminId");
        ALTER TABLE "User" ADD CONSTRAINT "User_adminId_fkey"
            FOREIGN KEY ("adminId") REFERENCES "User"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE 'Added adminId column';
    ELSE
        RAISE NOTICE 'adminId column already exists';
    END IF;
END $$;

-- STEP 2: Clear existing test data (OPTIONAL - comment out if you want to keep data)
-- ============================================
DELETE FROM "Activity";
DELETE FROM "Attempt";
DELETE FROM "Enrollment";
DELETE FROM "Item";
DELETE FROM "Lesson";
DELETE FROM "Unit";
DELETE FROM "Curriculum";
DELETE FROM "GlossaryTerm";
DELETE FROM "Student";
DELETE FROM "StudentInvitation";
DELETE FROM "DigestLog";
DELETE FROM "Session";
DELETE FROM "Account";
DELETE FROM "User";

-- STEP 3: Create Admin User
-- ============================================
-- Email: admin@homeschool.com
-- Password: password123
INSERT INTO "User" (
    id,
    name,
    email,
    password,
    role,
    "createdAt",
    "updatedAt",
    "digestFrequency",
    "notifyEmail",
    "notifySms"
)
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

-- STEP 4: Create Parent Accounts
-- ============================================
-- Parent 1: parent1@homeschool.com / password123
INSERT INTO "User" (
    id,
    name,
    email,
    password,
    role,
    "adminId",
    "createdAt",
    "updatedAt",
    "digestFrequency",
    "notifyEmail",
    "notifySms"
)
VALUES (
    'parent_001',
    'Sarah Smith',
    'parent1@homeschool.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8H.6ueI/MrLT1JXKFQ3LQjxz7qkLa',
    'PARENT',
    'admin_001',
    NOW(),
    NOW(),
    'daily',
    true,
    false
);

-- Parent 2: parent2@homeschool.com / password123
INSERT INTO "User" (
    id,
    name,
    email,
    password,
    role,
    "adminId",
    "createdAt",
    "updatedAt",
    "digestFrequency",
    "notifyEmail",
    "notifySms"
)
VALUES (
    'parent_002',
    'Michael Johnson',
    'parent2@homeschool.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8H.6ueI/MrLT1JXKFQ3LQjxz7qkLa',
    'PARENT',
    'admin_001',
    NOW(),
    NOW(),
    'weekly',
    true,
    false
);

-- Parent 3: parent3@homeschool.com / password123
INSERT INTO "User" (
    id,
    name,
    email,
    password,
    role,
    "adminId",
    "createdAt",
    "updatedAt",
    "digestFrequency",
    "notifyEmail",
    "notifySms"
)
VALUES (
    'parent_003',
    'Emily Davis',
    'parent3@homeschool.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8H.6ueI/MrLT1JXKFQ3LQjxz7qkLa',
    'PARENT',
    'admin_001',
    NOW(),
    NOW(),
    'daily',
    true,
    false
);

-- STEP 5: Create Students
-- ============================================
INSERT INTO "Student" (id, name, "parentId", grade, "createdAt", "updatedAt")
VALUES
    ('student_001', 'Emma Smith', 'parent_001', 8, NOW(), NOW()),
    ('student_002', 'Noah Smith', 'parent_001', 6, NOW(), NOW()),
    ('student_003', 'Olivia Johnson', 'parent_002', 7, NOW(), NOW()),
    ('student_004', 'Liam Davis', 'parent_003', 5, NOW(), NOW()),
    ('student_005', 'Sophia Davis', 'parent_003', 9, NOW(), NOW());

-- STEP 6: Verify everything worked
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

    RAISE NOTICE '✅ Setup Complete!';
    RAISE NOTICE 'Admins created: %', admin_count;
    RAISE NOTICE 'Parents created: %', parent_count;
    RAISE NOTICE 'Students created: %', student_count;

    IF admin_count = 0 THEN
        RAISE EXCEPTION 'ERROR: Admin was not created!';
    END IF;
END $$;

-- ============================================
-- DONE! Test accounts created:
-- ============================================
-- Admin:    admin@homeschool.com    / password123
-- Parent 1: parent1@homeschool.com  / password123 (2 students)
-- Parent 2: parent2@homeschool.com  / password123 (1 student)
-- Parent 3: parent3@homeschool.com  / password123 (2 students)
-- ============================================

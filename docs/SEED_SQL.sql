-- ============================================
-- SEED DATA SQL - Run this in your database console
-- ============================================
-- This creates:
-- - 1 Admin account
-- - 3 Parent accounts (linked to admin)
-- - 5 Students (across the 3 parents)
-- - 1 Curriculum with lessons
-- - Sample data and enrollments
-- ============================================

-- Step 1: Create Admin User
-- Email: admin@homeschool.com
-- Password: password123
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

-- Step 2: Create Parent Accounts (linked to admin)
-- Parent 1: parent1@homeschool.com / password123
INSERT INTO "User" (id, name, email, password, role, "adminId", "createdAt", "updatedAt", "digestFrequency", "notifyEmail", "notifySms")
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
INSERT INTO "User" (id, name, email, password, role, "adminId", "createdAt", "updatedAt", "digestFrequency", "notifyEmail", "notifySms")
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
INSERT INTO "User" (id, name, email, password, role, "adminId", "createdAt", "updatedAt", "digestFrequency", "notifyEmail", "notifySms")
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

-- Step 3: Create Students
-- Parent 1's students
INSERT INTO "Student" (id, name, "parentId", grade, "createdAt", "updatedAt")
VALUES
  ('student_001', 'Emma Smith', 'parent_001', 8, NOW(), NOW()),
  ('student_002', 'Noah Smith', 'parent_001', 6, NOW(), NOW());

-- Parent 2's student
INSERT INTO "Student" (id, name, "parentId", grade, "createdAt", "updatedAt")
VALUES
  ('student_003', 'Olivia Johnson', 'parent_002', 7, NOW(), NOW());

-- Parent 3's students
INSERT INTO "Student" (id, name, "parentId", grade, "createdAt", "updatedAt")
VALUES
  ('student_004', 'Liam Davis', 'parent_003', 5, NOW(), NOW()),
  ('student_005', 'Sophia Davis', 'parent_003', 9, NOW(), NOW());

-- Step 4: Create Glossary Terms
INSERT INTO "GlossaryTerm" (id, term, definition, derivation, "createdAt", "updatedAt")
VALUES
  (
    'gloss_001',
    'photosynthesis',
    'The process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar.',
    'From Greek ''photo'' (light) and ''synthesis'' (putting together)',
    NOW(),
    NOW()
  ),
  (
    'gloss_002',
    'mitochondria',
    'The powerhouse of the cell - organelles that generate most of the cell''s supply of ATP, used as a source of chemical energy.',
    'From Greek ''mitos'' (thread) and ''chondros'' (granule)',
    NOW(),
    NOW()
  ),
  (
    'gloss_003',
    'ecosystem',
    'A biological community of interacting organisms and their physical environment.',
    'From Greek ''oikos'' (house) and ''systema'' (organized whole)',
    NOW(),
    NOW()
  );

-- Step 5: Create Curriculum
INSERT INTO "Curriculum" (id, name, description, subject, grade, provider, "createdById", "isPublic", "createdAt", "updatedAt")
VALUES (
  'curriculum_001',
  'U.S. History: The Civil War',
  'A comprehensive study of the American Civil War, from its causes to its lasting impact on American society.',
  'History',
  8,
  'American History Academy',
  'parent_001',
  true,
  NOW(),
  NOW()
);

-- Step 6: Create Units
INSERT INTO "Unit" (id, "curriculumId", title, description, "order")
VALUES
  (
    'unit_001',
    'curriculum_001',
    'Causes of the Civil War',
    'Understanding the economic, social, and political factors that led to the Civil War',
    1
  ),
  (
    'unit_002',
    'curriculum_001',
    'The War Begins',
    'The outbreak of the Civil War and early battles',
    2
  );

-- Step 7: Create Lessons
INSERT INTO "Lesson" (id, "unitId", title, description, "contentMd", threshold, "order", objectives, "createdAt", "updatedAt")
VALUES
  (
    'lesson_001',
    'unit_001',
    'Introduction to Pre-Civil War America',
    'Overview of the United States in the 1850s',
    '# Introduction to Pre-Civil War America

## The Divided Nation

In the 1850s, the United States was rapidly expanding westward. However, this expansion brought serious questions about whether new states would allow slavery or be free states.

## Key Issues

1. **Economic Differences**: The North had an industrial economy, while the South relied on agriculture and slavery.
2. **States'' Rights**: Southern states believed they had the right to make their own decisions about slavery.
3. **Abolition Movement**: Growing numbers of people in the North opposed slavery on moral grounds.

## The Compromise of 1850

Congress attempted to ease tensions by allowing some territories to decide the slavery question for themselves through popular sovereignty.',
    70,
    1,
    '["8.H.1", "8.H.2"]',
    NOW(),
    NOW()
  ),
  (
    'lesson_002',
    'unit_001',
    'The Abolitionist Movement',
    'Key figures and events in the fight against slavery',
    '# The Abolitionist Movement

## Fighting for Freedom

The abolitionist movement grew stronger in the 1840s and 1850s. Abolitionists believed that slavery was morally wrong and should be ended immediately.

## Key Figures

- **Frederick Douglass**: Former slave who became a powerful speaker and writer
- **Harriet Tubman**: Conductor on the Underground Railroad who helped hundreds escape slavery
- **William Lloyd Garrison**: Published the anti-slavery newspaper "The Liberator"

## Uncle Tom''s Cabin

Harriet Beecher Stowe''s novel shocked many Northerners with its depiction of slavery''s brutality.',
    75,
    2,
    '["8.H.3", "8.H.4"]',
    NOW(),
    NOW()
  ),
  (
    'lesson_003',
    'unit_002',
    'Fort Sumter and the Start of War',
    'The first shots of the Civil War',
    '# Fort Sumter: The War Begins

## April 12, 1861

Confederate forces opened fire on Fort Sumter in Charleston Harbor, South Carolina. This marked the beginning of the Civil War.

## The Nation Divides

After Fort Sumter, President Lincoln called for 75,000 volunteers to put down the rebellion. This prompted four more Southern states to secede and join the Confederacy.',
    70,
    1,
    '["8.H.5"]',
    NOW(),
    NOW()
  );

-- Step 8: Create Items (Quiz Questions)
INSERT INTO "Item" (id, "lessonId", type, "order", prompt, choices, "answerKey", points, "createdAt", "updatedAt")
VALUES
  (
    'item_001',
    'lesson_001',
    'MCQ',
    1,
    'What was the main economic difference between the North and South before the Civil War?',
    '["The North relied on agriculture while the South was industrial", "The North was industrial while the South relied on agriculture", "Both regions had identical economies", "Neither region had a developed economy"]',
    '{"correct": [1]}',
    1,
    NOW(),
    NOW()
  ),
  (
    'item_002',
    'lesson_001',
    'TRUE_FALSE',
    2,
    'The Compromise of 1850 allowed some territories to decide the slavery question through popular sovereignty.',
    '["True", "False"]',
    '{"correct": [0]}',
    1,
    NOW(),
    NOW()
  ),
  (
    'item_003',
    'lesson_001',
    'SHORT_ANSWER',
    3,
    'What does ''states'' rights'' refer to in the context of the Civil War?',
    NULL,
    '{"patterns": ["/states.*right.*own.*decision/i", "/southern states.*make.*own.*laws/i", "states rights to decide about slavery"]}',
    2,
    NOW(),
    NOW()
  ),
  (
    'item_004',
    'lesson_002',
    'MCQ',
    1,
    'Who was Frederick Douglass?',
    '["A slave owner who defended slavery", "A former slave who became an abolitionist speaker", "A politician who supported states'' rights", "A general in the Confederate Army"]',
    '{"correct": [1]}',
    1,
    NOW(),
    NOW()
  ),
  (
    'item_005',
    'lesson_002',
    'MCQ',
    2,
    'What was the Underground Railroad?',
    '["An actual railroad built underground", "A network that helped enslaved people escape to freedom", "A mining operation in the South", "A transportation system for Confederate troops"]',
    '{"correct": [1]}',
    1,
    NOW(),
    NOW()
  ),
  (
    'item_006',
    'lesson_003',
    'MCQ',
    1,
    'When did the Civil War begin?',
    '["April 12, 1861", "July 4, 1861", "January 1, 1860", "December 20, 1860"]',
    '{"correct": [0]}',
    1,
    NOW(),
    NOW()
  );

-- Step 9: Create Enrollments
INSERT INTO "Enrollment" (id, "studentId", "curriculumId", progress, "enrolledAt", "updatedAt")
VALUES
  ('enroll_001', 'student_001', 'curriculum_001', '{}', NOW(), NOW()),
  ('enroll_002', 'student_002', 'curriculum_001', '{}', NOW(), NOW()),
  ('enroll_003', 'student_003', 'curriculum_001', '{}', NOW(), NOW());

-- Step 10: Create Sample Attempt (Student 1 completed first lesson)
INSERT INTO "Attempt" (id, "studentId", "lessonId", score, "maxScore", earned, detail, "createdAt")
VALUES (
  'attempt_001',
  'student_001',
  'lesson_001',
  85,
  4,
  3,
  '{"item1": {"answer": 1, "correct": true, "points": 1}, "item2": {"answer": 0, "correct": true, "points": 1}, "item3": {"answer": "States rights to decide about slavery", "correct": true, "points": 2}}',
  NOW()
);

-- Step 11: Create Activity Log
INSERT INTO "Activity" (id, "studentId", type, "lessonId", metadata, "createdAt")
VALUES (
  'activity_001',
  'student_001',
  'lesson_completed',
  'lesson_001',
  '{"score": 85, "threshold": 70, "passed": true}',
  NOW()
);

-- ============================================
-- DONE! You now have:
-- ============================================
-- ✅ 1 Admin account: admin@homeschool.com / password123
-- ✅ 3 Parent accounts (parent1, parent2, parent3)
-- ✅ 5 Students distributed across parents
-- ✅ 1 Complete curriculum with 3 lessons
-- ✅ Quiz questions for each lesson
-- ✅ Sample enrollment and attempt data
-- ✅ Glossary terms
-- ============================================

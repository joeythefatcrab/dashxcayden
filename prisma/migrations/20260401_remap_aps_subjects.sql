-- Remap old 23-subject APS values to new 7 consolidated categories (2026 format)
-- Applies to: Curriculum.apsSubject and ExternalActivity.category

-- ── ENGLISH ───────────────────────────────────────────────────────────────────
UPDATE "Curriculum"
SET "apsSubject" = 'ENGLISH (Reading, Writing, Spelling, Grammar)'
WHERE "apsSubject" IN (
  'Study Skills/Study Technology',
  'Reading',
  'Vocabulary',
  'Handwriting',
  'Creative Writing',
  'Grammar',
  'Spelling'
);

UPDATE "ExternalActivity"
SET "category" = 'ENGLISH (Reading, Writing, Spelling, Grammar)'
WHERE "category" IN (
  'Study Skills/Study Technology',
  'Reading',
  'Vocabulary',
  'Handwriting',
  'Creative Writing',
  'Grammar',
  'Spelling'
);

-- ── MATH/ECONOMICS/BUSINESS ───────────────────────────────────────────────────
UPDATE "Curriculum"
SET "apsSubject" = 'MATH/ECONOMICS/BUSINESS'
WHERE "apsSubject" IN ('Mathematics', 'Economics/Money');

UPDATE "ExternalActivity"
SET "category" = 'MATH/ECONOMICS/BUSINESS'
WHERE "category" IN ('Mathematics', 'Economics/Money');

-- ── GEOGRAPHY/HISTORY/GOVERNMENT/CIVICS ──────────────────────────────────────
UPDATE "Curriculum"
SET "apsSubject" = 'GEOGRAPHY/HISTORY/GOVERNMENT/CIVICS'
WHERE "apsSubject" IN ('Geography', 'American/World History', 'Government/Civics');

UPDATE "ExternalActivity"
SET "category" = 'GEOGRAPHY/HISTORY/GOVERNMENT/CIVICS'
WHERE "category" IN ('Geography', 'American/World History', 'Government/Civics');

-- ── SCIENCE/RESEARCH ──────────────────────────────────────────────────────────
UPDATE "Curriculum"
SET "apsSubject" = 'SCIENCE/RESEARCH'
WHERE "apsSubject" IN ('Science', 'Research');

UPDATE "ExternalActivity"
SET "category" = 'SCIENCE/RESEARCH'
WHERE "category" IN ('Science', 'Research');

-- ── ART/MUSIC/PERFORMANCE ─────────────────────────────────────────────────────
UPDATE "Curriculum"
SET "apsSubject" = 'ART/MUSIC/PERFORMANCE'
WHERE "apsSubject" IN ('Performing Arts', 'Foreign Language', 'Educational Films');

UPDATE "ExternalActivity"
SET "category" = 'ART/MUSIC/PERFORMANCE'
WHERE "category" IN ('Performing Arts', 'Foreign Language', 'Educational Films');

-- ── PHYSICAL EDUCATION ────────────────────────────────────────────────────────
UPDATE "Curriculum"
SET "apsSubject" = 'PHYSICAL EDUCATION'
WHERE "apsSubject" = 'PE';

UPDATE "ExternalActivity"
SET "category" = 'PHYSICAL EDUCATION'
WHERE "category" = 'PE';

-- ── ELECTIVES/SEMINARS/FIELD TRIPS/OTHER ─────────────────────────────────────
UPDATE "Curriculum"
SET "apsSubject" = 'ELECTIVES/SEMINARS/FIELD TRIPS/OTHER'
WHERE "apsSubject" IN ('Seminars', 'Field Trips', 'Online Coursework', 'Electives', 'Other');

UPDATE "ExternalActivity"
SET "category" = 'ELECTIVES/SEMINARS/FIELD TRIPS/OTHER'
WHERE "category" IN ('Seminars', 'Field Trips', 'Online Coursework', 'Electives', 'Other');

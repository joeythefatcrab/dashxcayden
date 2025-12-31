# Essay Submission Table Migration - Step by Step

## Step 1: Check Current State

Run this SQL to see what exists:
```sql
-- Check if table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'EssaySubmission';

-- Check columns if table exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'EssaySubmission'
ORDER BY ordinal_position;
```

## Step 2: Clean Slate

Run each of these SQL statements **one at a time** in your database UI:

```sql
-- 1. Drop table if it exists
DROP TABLE IF EXISTS "EssaySubmission" CASCADE;
```

```sql
-- 2. Create enum type
CREATE TYPE "EssayStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'GRADED');
```
*Note: If you get "type already exists" error, that's fine - skip to step 3*

```sql
-- 3. Create the table (copy this entire block as one statement)
CREATE TABLE "EssaySubmission" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "EssayStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "aiGrade" INTEGER,
    "aiStrengths" TEXT,
    "aiImprovements" TEXT,
    "aiSummary" TEXT,
    "aiParentNote" TEXT,
    "aiGradedAt" TIMESTAMP(3),
    "grade" INTEGER,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EssaySubmission_pkey" PRIMARY KEY ("id")
);
```

```sql
-- 4. Create indexes (run each one separately)
CREATE UNIQUE INDEX "EssaySubmission_studentId_itemId_key"
ON "EssaySubmission"("studentId", "itemId");
```

```sql
CREATE INDEX "EssaySubmission_studentId_idx"
ON "EssaySubmission"("studentId");
```

```sql
CREATE INDEX "EssaySubmission_lessonId_idx"
ON "EssaySubmission"("lessonId");
```

```sql
CREATE INDEX "EssaySubmission_itemId_idx"
ON "EssaySubmission"("itemId");
```

```sql
CREATE INDEX "EssaySubmission_status_idx"
ON "EssaySubmission"("status");
```

```sql
CREATE INDEX "EssaySubmission_submittedAt_idx"
ON "EssaySubmission"("submittedAt");
```

```sql
-- 5. Add foreign key
ALTER TABLE "EssaySubmission"
ADD CONSTRAINT "EssaySubmission_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
```

## Step 3: Verify

Run this to confirm it worked:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'EssaySubmission'
ORDER BY ordinal_position;
```

You should see all 18 columns listed.

## Step 4: Test in Your App

After running the migration, try submitting an essay. It should work!

---

## Troubleshooting

**If you get "type EssayStatus already exists":**
- That's fine, skip creating it and continue

**If you get "table already exists" on step 3:**
- Go back and run step 1 (DROP TABLE) again

**If foreign key fails:**
- Check that you have a Student table with an "id" column
- You can skip the foreign key if needed - it's not critical for basic functionality

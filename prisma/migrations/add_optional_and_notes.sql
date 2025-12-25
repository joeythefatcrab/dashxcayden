-- Add isOptional field to Item table
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "isOptional" BOOLEAN NOT NULL DEFAULT false;

-- Create Note table
CREATE TABLE IF NOT EXISTS "Note" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT,
    "itemId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint for Note.studentId
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Note_studentId_fkey'
    ) THEN
        ALTER TABLE "Note" ADD CONSTRAINT "Note_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes for Note table
CREATE INDEX IF NOT EXISTS "Note_studentId_idx" ON "Note"("studentId");
CREATE INDEX IF NOT EXISTS "Note_lessonId_idx" ON "Note"("lessonId");
CREATE INDEX IF NOT EXISTS "Note_itemId_idx" ON "Note"("itemId");

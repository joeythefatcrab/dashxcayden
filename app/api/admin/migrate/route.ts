import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// This endpoint manually creates the EssaySubmission table
// Call this once after deployment to set up the database
export async function POST(req: Request) {
  try {
    const session = await auth();

    // Only SUPERADMIN or ADMIN can run migrations
    if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create EssayStatus enum if it doesn't exist
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "EssayStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'GRADED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create EssaySubmission table if it doesn't exist
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EssaySubmission" (
        id TEXT NOT NULL,
        "studentId" TEXT NOT NULL,
        "lessonId" TEXT NOT NULL,
        "itemId" TEXT NOT NULL,
        content TEXT NOT NULL,
        status "EssayStatus" NOT NULL DEFAULT 'DRAFT',
        "submittedAt" TIMESTAMP(3),
        "aiGrade" INTEGER,
        "aiStrengths" TEXT,
        "aiImprovements" TEXT,
        "aiSummary" TEXT,
        "aiParentNote" TEXT,
        "aiGradedAt" TIMESTAMP(3),
        grade INTEGER,
        feedback TEXT,
        "gradedAt" TIMESTAMP(3),
        "gradedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EssaySubmission_pkey" PRIMARY KEY (id)
      );
    `);

    // Create indexes
    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "EssaySubmission_studentId_itemId_key"
      ON "EssaySubmission"("studentId", "itemId");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "EssaySubmission_studentId_idx"
      ON "EssaySubmission"("studentId");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "EssaySubmission_lessonId_idx"
      ON "EssaySubmission"("lessonId");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "EssaySubmission_itemId_idx"
      ON "EssaySubmission"("itemId");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "EssaySubmission_status_idx"
      ON "EssaySubmission"("status");
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "EssaySubmission_submittedAt_idx"
      ON "EssaySubmission"("submittedAt");
    `);

    // Add foreign key
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "EssaySubmission"
        ADD CONSTRAINT "EssaySubmission_studentId_fkey"
        FOREIGN KEY ("studentId") REFERENCES "Student"(id)
        ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    return NextResponse.json({
      success: true,
      message: "EssaySubmission table created successfully"
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Failed to run migration",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Check migration status
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if table exists
    const result = await db.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'EssaySubmission'
      );`
    );

    const tableExists = result[0]?.exists || false;

    return NextResponse.json({
      tableExists,
      message: tableExists
        ? "EssaySubmission table exists"
        : "EssaySubmission table does not exist. Call POST /api/admin/migrate to create it."
    });
  } catch (error) {
    console.error("Migration check error:", error);
    return NextResponse.json(
      { error: "Failed to check migration status" },
      { status: 500 }
    );
  }
}

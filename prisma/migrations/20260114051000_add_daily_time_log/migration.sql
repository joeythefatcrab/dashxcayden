-- CreateTable
CREATE TABLE "DailyTimeLog" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "minutesSpent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyTimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyTimeLog_studentId_date_curriculumId_key" ON "DailyTimeLog"("studentId", "date", "curriculumId");

-- CreateIndex
CREATE INDEX "DailyTimeLog_studentId_date_idx" ON "DailyTimeLog"("studentId", "date");

-- CreateIndex
CREATE INDEX "DailyTimeLog_curriculumId_idx" ON "DailyTimeLog"("curriculumId");

-- AddForeignKey
ALTER TABLE "DailyTimeLog" ADD CONSTRAINT "DailyTimeLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTimeLog" ADD CONSTRAINT "DailyTimeLog_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

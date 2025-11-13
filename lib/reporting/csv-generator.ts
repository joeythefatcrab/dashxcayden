import { db } from "@/lib/db";
import { format } from "date-fns";

export interface ReportFilters {
  studentIds?: string[];
  curriculumIds?: string[];
  startDate?: Date;
  endDate?: Date;
  parentId?: string;
}

export interface ProgressReportRow {
  studentName: string;
  studentGrade: number | null;
  curriculum: string;
  unit: string;
  lesson: string;
  attemptDate: string;
  score: number;
  maxScore: number;
  earned: number;
  passed: boolean;
  threshold: number;
  objectives: string;
}

/**
 * Generate progress report data
 */
export async function generateProgressReport(
  filters: ReportFilters
): Promise<ProgressReportRow[]> {
  // Build query conditions
  const whereClause: any = {};

  if (filters.studentIds && filters.studentIds.length > 0) {
    whereClause.studentId = { in: filters.studentIds };
  }

  if (filters.parentId) {
    whereClause.student = {
      parentId: filters.parentId,
    };
  }

  if (filters.startDate || filters.endDate) {
    whereClause.createdAt = {};
    if (filters.startDate) {
      whereClause.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      whereClause.createdAt.lte = filters.endDate;
    }
  }

  // Fetch attempts with related data
  const attempts = await db.attempt.findMany({
    where: whereClause,
    include: {
      student: true,
      lesson: {
        include: {
          unit: {
            include: {
              curriculum: true,
            },
          },
        },
      },
    },
    orderBy: [
      { student: { name: "asc" } },
      { createdAt: "desc" },
    ],
  });

  // Filter by curriculum if specified
  let filteredAttempts = attempts;
  if (filters.curriculumIds && filters.curriculumIds.length > 0) {
    filteredAttempts = attempts.filter((attempt) =>
      filters.curriculumIds!.includes(attempt.lesson.unit.curriculumId)
    );
  }

  // Transform to report rows
  const reportRows: ProgressReportRow[] = filteredAttempts.map((attempt) => {
    const lesson = attempt.lesson;
    const unit = lesson.unit;
    const curriculum = unit.curriculum;
    const student = attempt.student;
    const passed = attempt.score >= lesson.threshold;

    return {
      studentName: student.name,
      studentGrade: student.grade,
      curriculum: curriculum.name,
      unit: unit.title,
      lesson: lesson.title,
      attemptDate: format(attempt.createdAt, "yyyy-MM-dd HH:mm:ss"),
      score: attempt.score,
      maxScore: attempt.maxScore,
      earned: attempt.earned,
      passed,
      threshold: lesson.threshold,
      objectives: lesson.objectives.join(", "),
    };
  });

  return reportRows;
}

/**
 * Convert report rows to CSV string
 */
export function convertToCSV(rows: ProgressReportRow[]): string {
  if (rows.length === 0) {
    return "No data available\n";
  }

  // CSV headers
  const headers = [
    "Student Name",
    "Grade",
    "Curriculum",
    "Unit",
    "Lesson",
    "Date",
    "Score (%)",
    "Points Earned",
    "Points Possible",
    "Passed",
    "Passing Threshold",
    "Learning Objectives",
  ];

  // Convert rows to CSV format
  const csvRows = rows.map((row) => [
    escapeCSV(row.studentName),
    row.studentGrade?.toString() || "",
    escapeCSV(row.curriculum),
    escapeCSV(row.unit),
    escapeCSV(row.lesson),
    row.attemptDate,
    row.score.toString(),
    row.earned.toString(),
    row.maxScore.toString(),
    row.passed ? "Yes" : "No",
    row.threshold.toString(),
    escapeCSV(row.objectives),
  ]);

  // Combine headers and rows
  const allRows = [headers, ...csvRows];

  // Join into CSV string
  return allRows.map((row) => row.join(",")).join("\n");
}

/**
 * Escape CSV values (handle commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate summary statistics for a report
 */
export interface ReportSummary {
  totalAttempts: number;
  totalStudents: number;
  averageScore: number;
  passRate: number;
  curriculumBreakdown: Array<{
    curriculum: string;
    attempts: number;
    averageScore: number;
  }>;
}

export function generateSummary(rows: ProgressReportRow[]): ReportSummary {
  if (rows.length === 0) {
    return {
      totalAttempts: 0,
      totalStudents: 0,
      averageScore: 0,
      passRate: 0,
      curriculumBreakdown: [],
    };
  }

  const uniqueStudents = new Set(rows.map((r) => r.studentName));
  const totalAttempts = rows.length;
  const averageScore =
    rows.reduce((sum, r) => sum + r.score, 0) / totalAttempts;
  const passedCount = rows.filter((r) => r.passed).length;
  const passRate = (passedCount / totalAttempts) * 100;

  // Curriculum breakdown
  const curriculumMap: Record<
    string,
    { attempts: number; totalScore: number }
  > = {};

  rows.forEach((row) => {
    if (!curriculumMap[row.curriculum]) {
      curriculumMap[row.curriculum] = { attempts: 0, totalScore: 0 };
    }
    curriculumMap[row.curriculum].attempts++;
    curriculumMap[row.curriculum].totalScore += row.score;
  });

  const curriculumBreakdown = Object.entries(curriculumMap).map(
    ([curriculum, data]) => ({
      curriculum,
      attempts: data.attempts,
      averageScore: Math.round(data.totalScore / data.attempts),
    })
  );

  return {
    totalAttempts,
    totalStudents: uniqueStudents.size,
    averageScore: Math.round(averageScore),
    passRate: Math.round(passRate),
    curriculumBreakdown,
  };
}

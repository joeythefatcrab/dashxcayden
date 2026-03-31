import { db } from "@/lib/db";
import { format } from "date-fns";

export interface TimeEntry {
  curriculumName: string;
  minutesSpent: number;
  description?: string;
  date: string;
}

export interface StudentDigestData {
  name: string;
  lessonsCompleted: number;
  averageScore: number;
  topCurriculum: string;
  totalMinutes: number;
  timeEntries: TimeEntry[];
  recentActivities: Array<{
    type: string;
    lessonTitle: string;
    score?: number;
    timestamp: string;
  }>;
}

export interface DigestData {
  students: StudentDigestData[];
}

export async function buildDigestData(
  parentId: string,
  startDate: Date,
  endDate: Date
): Promise<DigestData | null> {
  const parent = await db.user.findUnique({
    where: { id: parentId },
    include: {
      children: {
        include: {
          attempts: {
            where: { createdAt: { gte: startDate, lte: endDate } },
            include: { lesson: { include: { unit: { include: { curriculum: true } } } } },
          },
          activities: {
            where: { createdAt: { gte: startDate, lte: endDate } },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          dailyTimeLogs: {
            where: { date: { gte: startDate, lte: endDate } },
            include: { curriculum: { select: { name: true } } },
            orderBy: { date: "desc" },
          },
        },
      },
    },
  });

  if (!parent || parent.children.length === 0) return null;

  const students: StudentDigestData[] = parent.children.map((student) => {
    const attempts = student.attempts;
    const lessonsCompleted = attempts.length;
    const averageScore =
      lessonsCompleted > 0
        ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / lessonsCompleted)
        : 0;

    const curriculumCounts: Record<string, number> = {};
    attempts.forEach((a) => {
      const name = a.lesson.unit.curriculum.name;
      curriculumCounts[name] = (curriculumCounts[name] || 0) + 1;
    });
    const topCurriculum =
      Object.keys(curriculumCounts).length > 0
        ? Object.entries(curriculumCounts).sort(([, a], [, b]) => b - a)[0][0]
        : "";

    const recentActivities = student.activities.map((activity) => ({
      type: activity.type,
      lessonTitle: "Lesson",
      score: undefined as number | undefined,
      timestamp: format(activity.createdAt, "MMM d, h:mm a"),
    }));

    const totalMinutes = student.dailyTimeLogs.reduce((s, l) => s + l.minutesSpent, 0);
    const timeEntries: TimeEntry[] = student.dailyTimeLogs.map((log) => ({
      curriculumName: log.curriculum.name,
      minutesSpent: log.minutesSpent,
      description: log.description ?? undefined,
      date: format(log.date, "MMM d"),
    }));

    return {
      name: student.name,
      lessonsCompleted,
      averageScore,
      topCurriculum,
      totalMinutes,
      timeEntries,
      recentActivities,
    };
  });

  return { students };
}

/** Format minutes as "1h 30m" or "45m" */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

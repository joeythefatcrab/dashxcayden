import { inngest } from "../client";
import { db } from "@/lib/db";
import { resend, SENDER_EMAIL } from "@/lib/email/resend";
import { ParentDigestEmail } from "@/emails/ParentDigest";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

interface StudentProgressData {
  name: string;
  lessonsCompleted: number;
  averageScore: number;
  topCurriculum: string;
  totalMinutes: number;
  timeEntries: Array<{ curriculumName: string; minutesSpent: number; description?: string; date: string }>;
  recentActivities: Array<{
    type: string;
    lessonTitle: string;
    score?: number;
    timestamp: string;
  }>;
}

/**
 * Generate digest data for a parent's students
 */
async function generateDigestData(
  parentId: string,
  frequency: "daily" | "weekly"
): Promise<{ students: StudentProgressData[]; parentName: string; parentEmail: string } | null> {
  const parent = await db.user.findUnique({
    where: { id: parentId },
    include: {
      children: {
        include: {
          enrollments: {
            include: {
              curriculum: true,
            },
          },
          attempts: {
            include: {
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
          },
          activities: {
            include: {
              student: true,
            },
          },
        },
      },
    },
  });

  if (!parent || parent.children.length === 0) {
    return null;
  }

  // Determine date range based on frequency
  const daysBack = frequency === "daily" ? 1 : 7;
  const startDate = startOfDay(subDays(new Date(), daysBack));
  const endDate = endOfDay(new Date());

  const studentsData: StudentProgressData[] = [];

  for (const student of parent.children) {
    // Get recent attempts within the date range
    const recentAttempts = student.attempts.filter(
      (attempt) => attempt.createdAt >= startDate && attempt.createdAt <= endDate
    );

    // Calculate stats
    const lessonsCompleted = recentAttempts.length;
    const averageScore =
      lessonsCompleted > 0
        ? Math.round(recentAttempts.reduce((sum, a) => sum + a.score, 0) / lessonsCompleted)
        : 0;

    // Find most active curriculum
    const curriculumCounts: Record<string, number> = {};
    recentAttempts.forEach((attempt) => {
      const curriculumName = attempt.lesson.unit.curriculum.name;
      curriculumCounts[curriculumName] = (curriculumCounts[curriculumName] || 0) + 1;
    });
    const topCurriculum =
      Object.keys(curriculumCounts).length > 0
        ? Object.entries(curriculumCounts).sort(([, a], [, b]) => b - a)[0][0]
        : "";

    // Get recent activities
    const recentActivities = student.activities
      .filter((activity) => activity.createdAt >= startDate && activity.createdAt <= endDate)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    // Format activities
    const formattedActivities = await Promise.all(
      recentActivities.map(async (activity) => {
        let lessonTitle = "Unknown Lesson";
        let score: number | undefined;

        if (activity.lessonId) {
          const lesson = await db.lesson.findUnique({
            where: { id: activity.lessonId },
          });
          if (lesson) {
            lessonTitle = lesson.title;
          }

          // Get score from attempts if completed
          if (activity.type === "lesson_completed") {
            const attempt = recentAttempts.find((a) => a.lessonId === activity.lessonId);
            if (attempt) {
              score = attempt.score;
            }
          }
        }

        return {
          type: activity.type,
          lessonTitle,
          score,
          timestamp: format(activity.createdAt, "MMM d, h:mm a"),
        };
      })
    );

    studentsData.push({
      name: student.name,
      lessonsCompleted,
      averageScore,
      topCurriculum,
      totalMinutes: 0,
      timeEntries: [],
      recentActivities: formattedActivities,
    });
  }

  return {
    students: studentsData,
    parentName: parent.name || "Parent",
    parentEmail: parent.email,
  };
}

/**
 * Send digest email to a single parent
 */
export const sendParentDigest = inngest.createFunction(
  { id: "send-parent-digest", name: "Send Parent Digest" },
  { event: "digest/send.parent" },
  async ({ event, step }) => {
    const { parentId, frequency } = event.data as {
      parentId: string;
      frequency: "daily" | "weekly";
    };

    // Generate digest data
    const digestData = await step.run("generate-digest-data", async () => {
      return await generateDigestData(parentId, frequency);
    });

    if (!digestData) {
      return { skipped: true, reason: "No students or data for this parent" };
    }

    // Skip if no activity
    const totalLessons = digestData.students.reduce((sum, s) => sum + s.lessonsCompleted, 0);
    if (totalLessons === 0) {
      return { skipped: true, reason: "No activity in this period" };
    }

    // Send email
    const emailResult = await step.run("send-email", async () => {
      const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      return await resend.emails.send({
        from: SENDER_EMAIL,
        to: digestData.parentEmail,
        subject: `Your ${frequency} learning update - HomeschoolHub`,
        react: ParentDigestEmail({
          parentName: digestData.parentName,
          students: digestData.students,
          frequency,
          dashboardUrl: `${dashboardUrl}/dashboard`,
        }),
      });
    });

    // Log digest
    await step.run("log-digest", async () => {
      return await db.digestLog.create({
        data: {
          parentId,
          type: frequency,
          summary: {
            students: digestData.students.map((s) => ({
              name: s.name,
              lessonsCompleted: s.lessonsCompleted,
              averageScore: s.averageScore,
            })),
          },
        },
      });
    });

    return {
      success: true,
      parentEmail: digestData.parentEmail,
      emailId: emailResult.data?.id,
      studentsCount: digestData.students.length,
    };
  }
);

/**
 * Cron job to send daily digests
 */
export const dailyDigestCron = inngest.createFunction(
  { id: "daily-digest-cron", name: "Daily Digest Cron" },
  { cron: "0 8 * * *" }, // Every day at 8 AM
  async ({ step }) => {
    // Find all parents with daily digest preference
    const parents = await step.run("find-daily-digest-parents", async () => {
      return await db.user.findMany({
        where: {
          role: "PARENT",
          digestFrequency: "daily",
          notifyEmail: true,
        },
        select: {
          id: true,
          email: true,
        },
      });
    });

    // Send digest events for each parent
    await step.run("trigger-digests", async () => {
      for (const parent of parents) {
        await inngest.send({
          name: "digest/send.parent",
          data: {
            parentId: parent.id,
            frequency: "daily" as const,
          },
        });
      }
    });

    return { triggered: parents.length };
  }
);

/**
 * Cron job to send weekly digests
 */
export const weeklyDigestCron = inngest.createFunction(
  { id: "weekly-digest-cron", name: "Weekly Digest Cron" },
  { cron: "0 9 * * 1" }, // Every Monday at 9 AM
  async ({ step }) => {
    // Find all parents with weekly digest preference
    const parents = await step.run("find-weekly-digest-parents", async () => {
      return await db.user.findMany({
        where: {
          role: "PARENT",
          digestFrequency: "weekly",
          notifyEmail: true,
        },
        select: {
          id: true,
          email: true,
        },
      });
    });

    // Send digest events for each parent
    await step.run("trigger-digests", async () => {
      for (const parent of parents) {
        await inngest.send({
          name: "digest/send.parent",
          data: {
            parentId: parent.id,
            frequency: "weekly" as const,
          },
        });
      }
    });

    return { triggered: parents.length };
  }
);

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resend, SENDER_EMAIL, isResendConfigured } from "@/lib/email/resend";
import { ParentDigestEmail } from "@/emails/ParentDigest";
import { render } from "@react-email/render";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export const runtime = "nodejs";
export const maxDuration = 60;

// Vercel calls cron routes with Authorization: Bearer <CRON_SECRET>
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // allow in dev if not configured
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isResendConfigured()) {
    return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" });
  }

  const parents = await db.user.findMany({
    where: { role: "PARENT", digestFrequency: "daily", notifyEmail: true },
    select: { id: true, email: true, name: true, emailPrefsJson: true },
  });

  let sent = 0;
  let skipped = 0;
  const appUrl = process.env.NEXTAUTH_URL || "https://example.com";
  const startDate = startOfDay(subDays(new Date(), 1));
  const endDate = endOfDay(new Date());

  for (const parent of parents) {
    const data = await buildDigestData(parent.id, startDate, endDate);
    if (!data || data.students.every((s) => s.lessonsCompleted === 0)) {
      skipped++;
      continue;
    }
    let prefs: Record<string, boolean> = {};
    try { prefs = JSON.parse(parent.emailPrefsJson || "{}"); } catch {}
    const showLessons = prefs.lessonCompletions !== false;
    const showScores = prefs.scores !== false;
    try {
      const html = await render(
        ParentDigestEmail({
          parentName: parent.name || "Parent",
          students: data.students,
          frequency: "daily",
          dashboardUrl: `${appUrl}/dashboard`,
          showLessons,
          showScores,
        })
      );
      await resend.emails.send({
        from: SENDER_EMAIL,
        to: parent.email,
        subject: "Your daily learning update",
        html,
      });
      sent++;
    } catch (err) {
      console.error(`Digest send failed for ${parent.email}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped, total: parents.length });
}

async function buildDigestData(parentId: string, startDate: Date, endDate: Date) {
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
        },
      },
    },
  });

  if (!parent || parent.children.length === 0) return null;

  const students = parent.children.map((student) => {
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

    return { name: student.name, lessonsCompleted, averageScore, topCurriculum, recentActivities };
  });

  return { students };
}

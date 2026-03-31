import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resend, SENDER_EMAIL, isResendConfigured } from "@/lib/email/resend";
import { ParentDigestEmail } from "@/emails/ParentDigest";
import { render } from "@react-email/render";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    if (session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Only parents can trigger digests" }, { status: 403 });
    }

    if (!isResendConfigured()) {
      return NextResponse.json({ error: "RESEND_API_KEY is not configured." }, { status: 503 });
    }

    const { frequency } = await req.json();
    const freq = ["daily", "weekly"].includes(frequency) ? frequency : "daily";

    const days = freq === "weekly" ? 7 : 1;
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    const parent = await db.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } });
    if (!parent) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const data = await buildDigestData(session.user.id, startDate, endDate);
    if (!data) return NextResponse.json({ error: "No students found" }, { status: 404 });

    const appUrl = process.env.NEXTAUTH_URL || "https://example.com";
    const html = await render(
      ParentDigestEmail({
        parentName: parent.name || "Parent",
        students: data.students,
        frequency: freq as "daily" | "weekly",
        dashboardUrl: `${appUrl}/dashboard`,
      })
    );

    await resend.emails.send({
      from: SENDER_EMAIL,
      to: parent.email,
      subject: `Your ${freq} learning update (test)`,
      html,
    });

    return NextResponse.json({ success: true, message: `Test ${freq} digest sent to ${parent.email}` });
  } catch (error) {
    console.error("Error sending test digest:", error);
    return NextResponse.json(
      { error: "Failed to send test digest: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
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

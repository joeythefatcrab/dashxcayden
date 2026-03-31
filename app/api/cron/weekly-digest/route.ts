import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resend, SENDER_EMAIL, isResendConfigured } from "@/lib/email/resend";
import { ParentDigestEmail } from "@/emails/ParentDigest";
import { render } from "@react-email/render";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { buildDigestData } from "@/lib/digest";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isResendConfigured()) {
    return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not configured" });
  }

  const parents = await db.user.findMany({
    where: { role: "PARENT", digestFrequency: "weekly", notifyEmail: true },
    select: { id: true, email: true, name: true, emailPrefsJson: true },
  });

  let sent = 0;
  let skipped = 0;
  const appUrl = process.env.NEXTAUTH_URL || "https://example.com";
  const startDate = startOfDay(subDays(new Date(), 7));
  const endDate = endOfDay(new Date());

  for (const parent of parents) {
    const data = await buildDigestData(parent.id, startDate, endDate);
    if (!data || data.students.every((s) => s.lessonsCompleted === 0 && s.totalMinutes === 0)) {
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
          frequency: "weekly",
          dashboardUrl: `${appUrl}/dashboard`,
          showLessons,
          showScores,
        })
      );
      await resend.emails.send({
        from: SENDER_EMAIL,
        to: parent.email,
        subject: "Your weekly learning update",
        html,
      });
      sent++;
    } catch (err) {
      console.error(`Weekly digest failed for ${parent.email}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped, total: parents.length });
}

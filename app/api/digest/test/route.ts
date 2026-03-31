import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resend, SENDER_EMAIL, isResendConfigured } from "@/lib/email/resend";
import { ParentDigestEmail } from "@/emails/ParentDigest";
import { render } from "@react-email/render";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { buildDigestData } from "@/lib/digest";

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

    const parent = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, emailPrefsJson: true },
    });
    if (!parent) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const data = await buildDigestData(session.user.id, startDate, endDate);
    if (!data) return NextResponse.json({ error: "No students found" }, { status: 404 });

    let prefs: Record<string, boolean> = {};
    try { prefs = JSON.parse(parent.emailPrefsJson || "{}"); } catch {}
    const showLessons = prefs.lessonCompletions !== false;
    const showScores = prefs.scores !== false;

    const appUrl = process.env.NEXTAUTH_URL || "https://example.com";
    const html = await render(
      ParentDigestEmail({
        parentName: parent.name || "Parent",
        students: data.students,
        frequency: freq as "daily" | "weekly",
        dashboardUrl: `${appUrl}/dashboard`,
        showLessons,
        showScores,
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

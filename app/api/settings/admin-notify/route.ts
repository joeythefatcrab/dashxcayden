import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // @ts-ignore
    const role = session.user.realRole || session.user.role;
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { notifyOnReportSubmission } = await req.json();
    if (typeof notifyOnReportSubmission !== "boolean") {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { notifyOnReportSubmission },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin-notify update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

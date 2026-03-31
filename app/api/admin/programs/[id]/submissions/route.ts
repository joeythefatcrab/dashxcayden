import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET  — list all submitted/approved items for a program
// PATCH — approve or return a submission (body: { completionId, status, adminNote? })

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // @ts-ignore
    const userRole: string = session.user.realRole || session.user.role || "";
    if (!["ADMIN", "SUPERADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all ESSAY items for this program that have been submitted
    const completions = await db.programItemCompletion.findMany({
      where: {
        item: { programId, requiresReview: true },
        status: { in: ["SUBMITTED", "APPROVED", "PENDING"] },
      },
      include: {
        item: { select: { id: true, sectionTitle: true, title: true, itemType: true } },
        enrollment: {
          include: { student: { select: { id: true, name: true, grade: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(completions);
  } catch (error) {
    console.error("submissions GET error:", error);
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // programId not needed for the update itself
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // @ts-ignore
    const userRole: string = session.user.realRole || session.user.role || "";
    if (!["ADMIN", "SUPERADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { completionId, status, adminNote } = await req.json();
    if (!completionId || !status) {
      return NextResponse.json({ error: "completionId and status required" }, { status: 400 });
    }

    if (!["APPROVED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "status must be APPROVED or PENDING" }, { status: 400 });
    }

    const updated = await db.programItemCompletion.update({
      where: { id: completionId },
      data: {
        status,
        adminNote: adminNote ?? undefined,
        reviewedAt: new Date(),
        reviewedById: session.user.id,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("submissions PATCH error:", error);
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}

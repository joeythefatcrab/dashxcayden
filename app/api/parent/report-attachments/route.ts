import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getRole(session: any): Promise<string> {
  return session?.user?.realRole || session?.user?.role || "";
}

// GET — list attachments for a report
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get("reportId");
  if (!reportId) return NextResponse.json({ error: "reportId required" }, { status: 400 });

  const attachments = await db.reportAttachment.findMany({
    where: { reportId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(attachments);
}

// POST — save a new attachment record after UploadThing upload
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await getRole(session);
  if (!["PARENT", "ADMIN", "SUPERADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { reportId, url, name, size, mimeType } = await req.json();
  if (!reportId || !url || !name) {
    return NextResponse.json({ error: "reportId, url, and name required" }, { status: 400 });
  }

  const attachment = await db.reportAttachment.create({
    data: { reportId, url, name, size: size ?? null, mimeType: mimeType ?? null },
  });

  return NextResponse.json(attachment);
}

// DELETE — remove an attachment
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await getRole(session);
  if (!["PARENT", "ADMIN", "SUPERADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { attachmentId } = await req.json();
  if (!attachmentId) return NextResponse.json({ error: "attachmentId required" }, { status: 400 });

  await db.reportAttachment.delete({ where: { id: attachmentId } });
  return NextResponse.json({ ok: true });
}

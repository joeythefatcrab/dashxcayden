import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// Public endpoint — lets the sign-up page preview a code's role before the user fills out the form
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const invite = await db.inviteCode.findUnique({
    where: { code },
    select: { role: true, usedAt: true, expiresAt: true, label: true },
  });

  if (!invite) {
    return NextResponse.json({ valid: false, error: "Invalid invite code" }, { status: 404 });
  }

  if (invite.usedAt) {
    return NextResponse.json({ valid: false, error: "This invite code has already been used" });
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: "This invite code has expired" });
  }

  return NextResponse.json({ valid: true, role: invite.role, label: invite.label });
}

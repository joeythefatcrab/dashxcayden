import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Roles ADMIN can issue; SUPERADMIN can also issue ADMIN
const ADMIN_ALLOWED_ROLES = ["PARENT", "STUDENT"];
const SUPERADMIN_ALLOWED_ROLES = ["PARENT", "STUDENT", "ADMIN"];

function getEffectiveRole(session: any): string {
  return session?.user?.realRole || session?.user?.role;
}

export async function POST(req: Request) {
  const session = await auth();
  const userRole = getEffectiveRole(session);

  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { role, label, expiresAt } = await req.json();

  const allowedRoles = userRole === "SUPERADMIN" ? SUPERADMIN_ALLOWED_ROLES : ADMIN_ALLOWED_ROLES;
  if (!role || !allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: `Invalid role. Allowed: ${allowedRoles.join(", ")}` },
      { status: 400 }
    );
  }

  const adminUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  const code = crypto.randomBytes(16).toString("hex");

  const invite = await db.inviteCode.create({
    data: {
      code,
      role,
      label: label || null,
      createdById: session.user.id,
      organizationId: adminUser?.organizationId || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  const host = req.headers.get("host") || "";
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : "http://localhost:3000");
  const signupUrl = `${baseUrl.replace(/\/+$/, "")}/sign-up?invite=${code}`;

  return NextResponse.json({ ...invite, signupUrl });
}

export async function GET(req: Request) {
  const session = await auth();
  const userRole = getEffectiveRole(session);

  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const adminUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  const where: any = {};
  if (userRole === "ADMIN") {
    where.organizationId = adminUser?.organizationId;
  }

  const codes = await db.inviteCode.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(codes);
}

export async function DELETE(req: Request) {
  const session = await auth();
  const userRole = getEffectiveRole(session);

  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const invite = await db.inviteCode.findUnique({ where: { id } });
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Admins can only delete codes they created within their org
  if (userRole === "ADMIN" && invite.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.inviteCode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

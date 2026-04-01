import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  // @ts-ignore
  const realRole = session?.user?.realRole || session?.user?.role;
  if (!session?.user || realRole !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId, name } = await req.json();
  if (!userId || typeof name !== "string") {
    return NextResponse.json({ error: "userId and name required" }, { status: 400 });
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { name: trimmed },
    select: { id: true, name: true },
  });

  return NextResponse.json(updated);
}

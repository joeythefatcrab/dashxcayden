import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// Toggle global paywall on/off
export async function POST(req: Request) {
  const session = await auth();
  // @ts-ignore
  const userRole = session?.user?.realRole || session?.user?.role;
  if (!session?.user || userRole !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { enabled } = await req.json();

  await db.systemSetting.upsert({
    where: { key: "paywall_enabled" },
    update: { value: enabled ? "true" : "false" },
    create: { key: "paywall_enabled", value: enabled ? "true" : "false" },
  });

  return NextResponse.json({ enabled });
}

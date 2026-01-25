import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();

    // Only SUPERADMIN role can access
    // @ts-ignore
    const userRole = session?.user?.realRole || session?.user?.role;
    if (!session?.user || userRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // Filter by activity type
    const userId = searchParams.get("userId"); // Filter by specific user
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;

    // Fetch activity logs
    const [activities, total] = await Promise.all([
      db.userActivity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      db.userActivity.count({ where }),
    ]);

    return NextResponse.json({
      activities,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

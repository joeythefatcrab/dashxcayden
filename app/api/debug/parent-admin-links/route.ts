import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Debug parent-admin relationships
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all parents
    const allParents = await db.user.findMany({
      where: {
        role: "PARENT",
      },
      select: {
        id: true,
        email: true,
        name: true,
        adminId: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    // Get parents linked to current admin
    const myParents = allParents.filter(p => p.adminId === session.user.id);

    // Get orphaned parents (no adminId)
    const orphanedParents = allParents.filter(p => !p.adminId);

    // Get parents linked to other admins
    const otherParents = allParents.filter(p => p.adminId && p.adminId !== session.user.id);

    return NextResponse.json({
      currentAdmin: {
        id: session.user.id,
        email: session.user.email,
      },
      summary: {
        total: allParents.length,
        linkedToYou: myParents.length,
        orphaned: orphanedParents.length,
        linkedToOthers: otherParents.length,
      },
      details: {
        myParents,
        orphanedParents,
        otherParents,
      },
    });
  } catch (error) {
    console.error("Error checking parent-admin links:", error);
    return NextResponse.json(
      { error: "Failed to check relationships" },
      { status: 500 }
    );
  }
}

// POST - Link orphaned parents to current admin
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find orphaned parents (no adminId)
    const orphanedParents = await db.user.findMany({
      where: {
        role: "PARENT",
        adminId: null,
      },
    });

    // Link them to current admin
    const updated = await db.user.updateMany({
      where: {
        role: "PARENT",
        adminId: null,
      },
      data: {
        adminId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Linked ${updated.count} orphaned parent(s) to your admin account`,
      linkedParents: orphanedParents.map(p => ({
        email: p.email,
        name: p.name,
      })),
    });
  } catch (error) {
    console.error("Error linking parents:", error);
    return NextResponse.json(
      { error: "Failed to link parents" },
      { status: 500 }
    );
  }
}

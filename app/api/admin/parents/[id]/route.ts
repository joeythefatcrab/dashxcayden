import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE - Delete a parent account (and all their students)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parentId = params.id;

    // Verify this parent belongs to the admin
    const parent = await db.user.findFirst({
      where: {
        id: parentId,
        role: "PARENT",
        adminId: session.user.id,
      },
      include: {
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete parent (students will be cascade deleted due to foreign key)
    await db.user.delete({
      where: { id: parentId },
    });

    return NextResponse.json({
      success: true,
      message: `Parent account deleted successfully (${parent._count.children} students also removed)`,
    });
  } catch (error) {
    console.error("Error deleting parent:", error);
    return NextResponse.json(
      { error: "Failed to delete parent account" },
      { status: 500 }
    );
  }
}

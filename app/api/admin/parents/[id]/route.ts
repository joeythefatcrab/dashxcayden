import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE - Delete a parent account (and all their students)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: parentId } = await params;

    // Verify this parent exists (single organization - all admins can manage all parents)
    const parent = await db.user.findFirst({
      where: {
        id: parentId,
        role: "PARENT",
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

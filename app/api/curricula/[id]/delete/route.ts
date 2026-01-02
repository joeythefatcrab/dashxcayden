import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "PARENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const curriculumId = params.id;

    // Check if curriculum exists and user has permission
    const curriculum = await db.curriculum.findUnique({
      where: { id: curriculumId },
      select: {
        id: true,
        createdById: true,
        name: true,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: "Curriculum not found" },
        { status: 404 }
      );
    }

    // Only allow deletion if user is admin or owner
    if (
      !["ADMIN", "SUPERADMIN"].includes(session.user.role) &&
      curriculum.createdById !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You don't have permission to delete this curriculum" },
        { status: 403 }
      );
    }

    // Delete curriculum (cascade will handle related data)
    // Prisma schema should have cascade deletes configured for:
    // - units -> lessons -> items
    // - enrollments
    // - student lesson progress
    await db.curriculum.delete({
      where: { id: curriculumId },
    });

    return NextResponse.json({
      success: true,
      message: `Curriculum "${curriculum.name}" deleted successfully`,
    });
  } catch (error: any) {
    console.error("Error deleting curriculum:", error);

    return NextResponse.json(
      {
        error: "Failed to delete curriculum",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

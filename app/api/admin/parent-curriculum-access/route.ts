import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET - Fetch all parent-curriculum access records
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId");
    const curriculumId = searchParams.get("curriculumId");

    let where: any = {};
    if (parentId) where.parentId = parentId;
    if (curriculumId) where.curriculumId = curriculumId;

    const accessRecords = await db.parentCurriculumAccess.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        curriculum: {
          select: {
            id: true,
            name: true,
            subject: true,
            grade: true,
          },
        },
      },
      orderBy: {
        grantedAt: "desc",
      },
    });

    return NextResponse.json({ accessRecords });
  } catch (error) {
    console.error("Error fetching parent curriculum access:", error);
    return NextResponse.json(
      { error: "Failed to fetch access records" },
      { status: 500 }
    );
  }
}

// POST - Grant access to a parent for a curriculum
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { parentId, curriculumId } = body;

    if (!parentId || !curriculumId) {
      return NextResponse.json(
        { error: "parentId and curriculumId are required" },
        { status: 400 }
      );
    }

    // Verify parent exists and is actually a parent
    const parent = await db.user.findUnique({
      where: { id: parentId },
    });

    if (!parent || parent.role !== "PARENT") {
      return NextResponse.json(
        { error: "Invalid parent ID" },
        { status: 400 }
      );
    }

    // Verify curriculum exists
    const curriculum = await db.curriculum.findUnique({
      where: { id: curriculumId },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: "Invalid curriculum ID" },
        { status: 400 }
      );
    }

    // Grant access (upsert to avoid duplicates)
    const access = await db.parentCurriculumAccess.upsert({
      where: {
        parentId_curriculumId: {
          parentId,
          curriculumId,
        },
      },
      update: {
        grantedBy: session.user.id,
        grantedAt: new Date(),
      },
      create: {
        parentId,
        curriculumId,
        grantedBy: session.user.id,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        curriculum: {
          select: {
            id: true,
            name: true,
            subject: true,
            grade: true,
          },
        },
      },
    });

    return NextResponse.json({ access });
  } catch (error) {
    console.error("Error granting curriculum access:", error);
    return NextResponse.json(
      { error: "Failed to grant access" },
      { status: 500 }
    );
  }
}

// DELETE - Revoke access for a parent to a curriculum
export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId");
    const curriculumId = searchParams.get("curriculumId");

    if (!parentId || !curriculumId) {
      return NextResponse.json(
        { error: "parentId and curriculumId are required" },
        { status: 400 }
      );
    }

    // Delete the access record
    await db.parentCurriculumAccess.delete({
      where: {
        parentId_curriculumId: {
          parentId,
          curriculumId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking curriculum access:", error);
    return NextResponse.json(
      { error: "Failed to revoke access" },
      { status: 500 }
    );
  }
}

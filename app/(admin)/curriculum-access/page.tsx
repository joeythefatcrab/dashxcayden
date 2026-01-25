import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CurriculumAccessManager } from "@/components/admin/CurriculumAccessManager";

export default async function CurriculumAccessPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // @ts-ignore
  const userRole = session.user.realRole || session.user.role;
  if (!["ADMIN", "SUPERADMIN"].includes(userRole)) {
    redirect("/dashboard");
  }

  // Get all parents (for admin, only their parents; for superadmin, all parents)
  let parents;
  if (userRole === "SUPERADMIN") {
    parents = await db.user.findMany({
      where: { role: "PARENT" },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });
  } else {
    // Admin can only manage their assigned parents
    parents = await db.user.findMany({
      where: {
        role: "PARENT",
        adminId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });
  }

  // Get all curricula
  const curricula = await db.curriculum.findMany({
    select: {
      id: true,
      name: true,
      subject: true,
      grade: true,
      description: true,
      isPublic: true,
    },
    orderBy: { name: "asc" },
  });

  // Get existing access records
  const accessRecords = await db.parentCurriculumAccess.findMany({
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
        },
      },
    },
    orderBy: {
      grantedAt: "desc",
    },
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Curriculum Access Control</h1>
        <p className="text-muted-foreground">
          Control which parents can see specific curricula
        </p>
      </div>

      <CurriculumAccessManager
        parents={parents}
        curricula={curricula}
        initialAccessRecords={accessRecords}
      />
    </div>
  );
}

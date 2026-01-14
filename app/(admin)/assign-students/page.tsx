import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StudentParentAssigner } from "@/components/admin/StudentParentAssigner";

export default async function AssignStudentsPage() {
  const session = await auth();

  // Only ADMIN and SUPERADMIN can access
  // @ts-ignore
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Get all students
  const students = await db.student.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      parent: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get all parents
  const parents = await db.user.findMany({
    where: {
      role: "PARENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Assign Students to Parents</h1>
        <p className="text-muted-foreground">
          Connect existing student accounts with parent accounts
        </p>
      </div>

      <StudentParentAssigner students={students} parents={parents} />
    </div>
  );
}

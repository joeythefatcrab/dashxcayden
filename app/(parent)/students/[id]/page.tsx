import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StudentProgressDashboard } from "@/components/parent/StudentProgressDashboard";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // @ts-ignore - role exists in session
  if (!["PARENT", "ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Get student with all progress data
  const student = await db.student.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true,
        },
      },
      parent: {
        select: {
          name: true,
          email: true,
        },
      },
      enrollments: {
        include: {
          curriculum: {
            include: {
              units: {
                include: {
                  lessons: {
                    include: {
                      items: true,
                    },
                  },
                },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
      attempts: {
        include: {
          lesson: {
            include: {
              unit: {
                include: {
                  curriculum: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      notes: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!student) {
    notFound();
  }

  // Verify access - parents can only see their students, admins can see all
  if (session.user.role === "PARENT" && student.parentId !== session.user.id) {
    redirect("/students");
  }

  return <StudentProgressDashboard student={student} />;
}

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { VerificationInterface } from "@/components/parent/VerificationInterface";

export default async function VerifyHoursPage() {
  const session = await auth();
  const { user } = session!;

  if (user.role !== "PARENT" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get all students for this parent
  const students = await db.student.findMany({
    where: { parentId: user.id },
    select: {
      id: true,
      name: true,
    },
  });

  const studentIds = students.map(s => s.id);

  // Get unverified time logs
  const unverifiedTimeLogs = await db.dailyTimeLog.findMany({
    where: {
      studentId: { in: studentIds },
      verifiedByParent: false,
    },
    include: {
      student: {
        select: {
          name: true,
        },
      },
      curriculum: {
        select: {
          name: true,
          subject: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Get unverified external activities
  const unverifiedActivities = await db.externalActivity.findMany({
    where: {
      report: {
        studentId: { in: studentIds },
      },
      verifiedByParent: false,
    },
    include: {
      report: {
        select: {
          student: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <VerificationInterface
        timeLogs={unverifiedTimeLogs}
        activities={unverifiedActivities}
      />
    </div>
  );
}

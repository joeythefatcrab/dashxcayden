import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TimeAndActivitiesTabs } from "@/components/student/TimeAndActivitiesTabs";

export default async function MyTimePage() {
  const session = await auth();
  const { user } = session!;

  if (user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Get student record
  const student = await db.student.findFirst({
    where: { userId: user.id },
    include: {
      enrollments: {
        include: {
          curriculum: {
            select: {
              id: true,
              name: true,
              subject: true,
            },
          },
        },
      },
      monthlyReports: {
        where: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
        include: {
          externalActivities: {
            orderBy: {
              date: "desc",
            },
          },
        },
      },
    },
  });

  if (!student) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">My Time Tracking</h1>
        <p className="text-muted-foreground">Student profile not found.</p>
      </div>
    );
  }

  // Get recent time logs for this month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const timeLogs = await db.dailyTimeLog.findMany({
    where: {
      studentId: student.id,
      date: {
        gte: firstDayOfMonth,
      },
    },
    include: {
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

  // Get external activities from monthly reports
  const externalActivities = student.monthlyReports.flatMap(report => report.externalActivities);

  return (
    <div className="container mx-auto px-4 py-8">
      <TimeAndActivitiesTabs
        student={{
          id: student.id,
          name: student.name,
        }}
        curricula={student.enrollments.map(e => e.curriculum)}
        initialTimeLogs={timeLogs}
        initialActivities={externalActivities}
      />
    </div>
  );
}

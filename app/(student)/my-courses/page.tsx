import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { DailyGreeting } from "@/components/student/DailyGreeting";
import { NotificationBanner } from "@/components/notifications/NotificationBanner";
import { markAttendance } from "@/lib/attendance";

export default async function MyCoursesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Check if impersonating for better error messages
  const isImpersonating = session.user.isImpersonating || false;

  // Get student profile
  const orConditions: Array<{ userId?: string; parent?: { email: string } }> = [
    { userId: session.user.id },
  ];
  if (session.user.email) {
    orConditions.push({ parent: { email: session.user.email } });
  }

  const student = await db.student.findFirst({
    where: {
      OR: orConditions,
    },
  });

  if (!student) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Student Profile</CardTitle>
            <CardDescription>
              {isImpersonating
                ? "This superadmin account doesn't have a student profile. Create a test student account to QA the student experience."
                : "You need a student profile to access courses"
              }
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Mark attendance when student accesses their courses
  await markAttendance(student.id);

  // Get enrollments with curriculum details
  const enrollments = await db.enrollment.findMany({
    where: { studentId: student.id },
    include: {
      curriculum: {
        include: {
          units: {
            include: {
              lessons: true,
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <DailyGreeting studentName={student.name} studentId={student.id} />
      <NotificationBanner />

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">
          Track your progress and continue learning
        </p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Courses Yet</CardTitle>
            <CardDescription>
              You haven't been enrolled in any courses yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              You haven't enrolled in any courses yet. Browse available courses to get started!
            </p>
            <Link href="/browse-courses">
              <Button>Browse Courses</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {enrollments.map((enrollment) => {
            const totalLessons = enrollment.curriculum.units.reduce(
              (acc, unit) => acc + unit.lessons.length,
              0
            );

            const progress = enrollment.progress as any;
            const completedLessons = Object.values(progress).filter(
              (p: any) => p.completed
            ).length;

            const progressPercentage = totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0;

            return (
              <Link key={enrollment.id} href={`/my-courses/${enrollment.curriculumId}`}>
                <Card className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          {enrollment.curriculum.name}
                        </CardTitle>
                      </div>
                    </div>
                    {enrollment.curriculum.description && (
                      <CardDescription className="line-clamp-2">
                        {enrollment.curriculum.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{progressPercentage}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {completedLessons}/{totalLessons} lessons completed
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

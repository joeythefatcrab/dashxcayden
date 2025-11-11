import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, CheckCircle2, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";

export default async function CurriculumPage({
  params,
}: {
  params: Promise<{ curriculumId: string }>;
}) {
  const { curriculumId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Get student profile
  const orConditions = [{ userId: session.user.id }];
  if (session.user.email) {
    orConditions.push({ parent: { email: session.user.email } });
  }

  const student = await db.student.findFirst({
    where: {
      OR: orConditions,
    },
  });

  if (!student) {
    redirect("/dashboard");
  }

  // Get enrollment with progress
  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_curriculumId: {
        studentId: student.id,
        curriculumId,
      },
    },
    include: {
      curriculum: {
        include: {
          units: {
            include: {
              lessons: {
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!enrollment) {
    notFound();
  }

  const progress = (enrollment.progress as any) || {};

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Link href="/my-courses">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Courses
          </Button>
        </Link>

        <h1 className="mb-2 text-3xl font-bold">{enrollment.curriculum.name}</h1>
        {enrollment.curriculum.description && (
          <p className="text-muted-foreground">{enrollment.curriculum.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {enrollment.curriculum.units.map((unit, unitIdx) => (
          <Card key={unit.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Unit {unitIdx + 1}: {unit.title}
              </CardTitle>
              {unit.description && (
                <CardDescription>{unit.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {unit.lessons.map((lesson, lessonIdx) => {
                  const lessonProgress = progress[lesson.id];
                  const isCompleted = lessonProgress?.completed || false;
                  const bestScore = lessonProgress?.bestScore;

                  // Check if locked
                  let isLocked = false;
                  if (lessonIdx > 0 && !lessonProgress?.unlocked) {
                    const prevLesson = unit.lessons[lessonIdx - 1];
                    const prevProgress = progress[prevLesson.id];
                    if (!prevProgress || prevProgress.bestScore < prevLesson.threshold) {
                      isLocked = true;
                    }
                  }

                  return (
                    <div
                      key={lesson.id}
                      className={`flex items-center justify-between rounded-lg border p-4 ${
                        isLocked ? "opacity-60" : "hover:bg-accent"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : isLocked ? (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <PlayCircle className="h-5 w-5 text-primary" />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">
                              Lesson {lessonIdx + 1}: {lesson.title}
                            </h4>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="ml-8 mt-2 flex gap-4 text-xs text-muted-foreground">
                          {bestScore !== undefined && (
                            <span>Best score: {bestScore}%</span>
                          )}
                          <span>Threshold: {lesson.threshold}%</span>
                        </div>
                      </div>

                      {!isLocked ? (
                        <Link href={`/my-courses/${curriculumId}/lessons/${lesson.id}`}>
                          <Button size="sm">
                            {isCompleted ? "Review" : "Start"}
                          </Button>
                        </Link>
                      ) : (
                        <Button size="sm" disabled>
                          Locked
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

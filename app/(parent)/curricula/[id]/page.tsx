import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";
import Link from "next/link";
import { AIAssignmentGenerator } from "@/components/curriculum/AIAssignmentGenerator";

export default async function CurriculumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user || !["PARENT", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const curriculum = await db.curriculum.findUnique({
    where: { id },
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
  });

  if (!curriculum) {
    notFound();
  }

  const totalLessons = curriculum.units.reduce(
    (acc, unit) => acc + unit.lessons.length,
    0
  );

  const totalItems = curriculum.units.reduce(
    (acc, unit) =>
      acc + unit.lessons.reduce((sum, lesson) => sum + lesson.items.length, 0),
    0
  );

  return (
    <div className="px-4 py-8">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8">
          <Link href="/curricula">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Curricula
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{curriculum.name}</h1>
          {curriculum.description && (
            <p className="text-muted-foreground">{curriculum.description}</p>
          )}
          <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">{curriculum.units.length}</span>{" "}
              units
            </div>
            <div>
              <span className="font-medium">{totalLessons}</span> lessons
            </div>
            <div>
              <span className="font-medium">{totalItems}</span> assessment items
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {curriculum.units.map((unit) => (
            <Card key={unit.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Unit {unit.order + 1}: {unit.title}
                </CardTitle>
                {unit.description && (
                  <p className="text-sm text-muted-foreground">
                    {unit.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {unit.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-start justify-between gap-4 rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-medium">
                            Lesson {lesson.order + 1}: {lesson.title}
                          </h4>
                        </div>
                        {lesson.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {lesson.description}
                          </p>
                        )}
                        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                          <span>{lesson.items.length} questions</span>
                          <span>Threshold: {lesson.threshold}%</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <AIAssignmentGenerator
                          lessonId={lesson.id}
                          lessonTitle={lesson.title}
                          lessonDescription={lesson.description}
                          currentQuestionCount={lesson.items.length}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

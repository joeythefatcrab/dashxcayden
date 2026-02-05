import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, FileText, Pencil } from "lucide-react";
import Link from "next/link";

// Helper function to get item type badge
function getItemTypeBadge(type: string) {
  const variants: Record<string, { label: string; color: string }> = {
    CHECKBOX: { label: "Checkbox", color: "bg-blue-100 text-blue-800" },
    MCQ: { label: "Multiple Choice", color: "bg-purple-100 text-purple-800" },
    SHORT_ANSWER: { label: "Short Answer", color: "bg-green-100 text-green-800" },
    ESSAY: { label: "Essay", color: "bg-orange-100 text-orange-800" },
    TRUE_FALSE: { label: "True/False", color: "bg-gray-100 text-gray-800" },
  };
  return variants[type] || { label: type, color: "bg-gray-100 text-gray-800" };
}

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
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
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
            {["ADMIN", "SUPERADMIN"].includes(session.user.role) && (
              <Link href={`/curricula/${id}/edit`} className="ml-auto">
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Course
                </Button>
              </Link>
            )}
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
                <div className="space-y-4">
                  {unit.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium">
                          Lesson {lesson.order + 1}: {lesson.title}
                        </h4>
                      </div>
                      {lesson.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {lesson.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                        <span>{lesson.items.length} items</span>
                        <span>Threshold: {lesson.threshold}%</span>
                      </div>

                      {/* Show all items */}
                      {lesson.items.length > 0 && (
                        <div className="space-y-2 mt-3 border-t pt-3">
                          {lesson.items.map((item, idx) => {
                            const badge = getItemTypeBadge(item.type);
                            return (
                              <div key={item.id} className="flex items-start gap-3 text-sm">
                                <span className="text-muted-foreground min-w-[2rem]">
                                  {idx + 1}.
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs px-2 py-0.5 rounded ${badge.color}`}>
                                      {badge.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {item.points} pts
                                    </span>
                                  </div>
                                  <p className="text-sm">{item.prompt}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
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

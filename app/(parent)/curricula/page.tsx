import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, BarChart3 } from "lucide-react";
import Link from "next/link";
import { CurriculumUploader } from "@/components/curriculum/CurriculumUploader";
import { AICurriculumGenerator } from "@/components/curriculum/AICurriculumGenerator";
import { CurriculumChecksheetGenerator } from "@/components/curriculum/CurriculumChecksheetGenerator";
import { PDFChecklistGenerator } from "@/components/curriculum/PDFChecklistGenerator";
import { AssignCurriculumDialog } from "@/components/curriculum/AssignCurriculumDialog";

export default async function CurriculaPage() {
  const session = await auth();

  if (!session?.user || !["PARENT", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Fetch curricula created by this user
  const curricula = await db.curriculum.findMany({
    where: {
      createdById: session.user.id,
    },
    include: {
      units: {
        include: {
          lessons: true,
        },
      },
      enrollments: {
        select: {
          studentId: true,
          student: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch students for assignment
  // For parents: their own students
  // For admins: all students under their parents
  const students = await db.student.findMany({
    where:
      session.user.role === "PARENT"
        ? { parentId: session.user.id }
        : {
            parent: {
              adminId: session.user.id,
            },
          },
    select: {
      id: true,
      name: true,
      grade: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="px-4 py-8">
      <div className="container mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Curricula</h1>
            <p className="text-muted-foreground">
              Upload and manage your curriculum files
            </p>
          </div>
          <div className="flex gap-2">
            <CurriculumChecksheetGenerator />
            <AICurriculumGenerator />
            <PDFChecklistGenerator />
            <CurriculumUploader />
          </div>
        </div>

        {curricula.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No curricula yet</h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Generate a checksheet, create with AI, import a PDF, or upload a CSV file
              </p>
              <div className="flex gap-2">
                <CurriculumChecksheetGenerator />
                <AICurriculumGenerator />
                <PDFChecklistGenerator />
                <CurriculumUploader />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {curricula.map((curriculum) => {
              const lessonCount = curriculum.units.reduce(
                (acc, unit) => acc + unit.lessons.length,
                0
              );

              return (
                <Card key={curriculum.id} className="flex h-full flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="line-clamp-2">{curriculum.name}</span>
                    </CardTitle>
                    {curriculum.description && (
                      <CardDescription className="line-clamp-2">
                        {curriculum.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">
                          {curriculum.units.length}
                        </span>{" "}
                        units
                      </div>
                      <div>
                        <span className="font-medium">{lessonCount}</span>{" "}
                        lessons
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {curriculum.subject && (
                        <Badge variant="secondary">{curriculum.subject}</Badge>
                      )}
                    </div>

                    {/* Enrollment Status */}
                    {curriculum._count.enrollments > 0 && (
                      <div className="flex items-center gap-2 rounded-md bg-green-50 p-2 text-sm">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-green-900">
                          Assigned to {curriculum._count.enrollments} student
                          {curriculum._count.enrollments > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto flex gap-2">
                      <Link href={`/curricula/${curriculum.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                      <AssignCurriculumDialog
                        curriculumId={curriculum.id}
                        curriculumName={curriculum.name}
                        students={students}
                        assignedStudentIds={curriculum.enrollments.map(
                          (e) => e.studentId
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

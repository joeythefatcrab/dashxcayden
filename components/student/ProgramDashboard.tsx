"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowRight, CheckSquare, Loader2, Trophy } from "lucide-react";
import Link from "next/link";

type Course = {
  programCourseId: string;
  curriculumId: string;
  name: string;
  subject: string | null;
  isRequired: boolean;
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
};

type ProgramData = {
  program: { id: string; name: string; academicYear: string; description: string | null };
  studentId: string;
  totalLessons: number;
  totalCompleted: number;
  overallPct: number;
  courses: Course[];
  nextLesson: { curriculumId: string; lessonId: string; lessonTitle: string; courseName: string } | null;
  completedAt: string | null;
};

export function ProgramDashboard() {
  const [data, setData] = useState<ProgramData | null | "loading">("loading");

  useEffect(() => {
    fetch("/api/student/my-program")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (data === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Program Found</CardTitle>
            <CardDescription>You haven't been enrolled in a yearly program yet. Ask your admin to set one up.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/my-courses">
              <Button variant="outline">View Individual Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColor = (pct: number) => {
    if (pct === 100) return "bg-green-500";
    if (pct > 0) return "bg-primary";
    return "bg-gray-200 dark:bg-gray-700";
  };

  const statusLabel = (pct: number) => {
    if (pct === 100) return { label: "Complete", cls: "bg-green-100 text-green-800" };
    if (pct > 0) return { label: "In Progress", cls: "bg-blue-100 text-blue-800" };
    return { label: "Not Started", cls: "bg-gray-100 text-gray-600" };
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold">{data.program.name}</h1>
          <Badge variant="outline">{data.program.academicYear}</Badge>
        </div>
        {data.program.description && (
          <p className="text-muted-foreground">{data.program.description}</p>
        )}
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Overall Year Progress</p>
              <p className="text-3xl font-bold">{data.overallPct}%</p>
              <p className="text-sm text-muted-foreground">
                {data.totalCompleted} of {data.totalLessons} lessons complete
              </p>
            </div>
            {data.overallPct === 100 ? (
              <Trophy className="h-12 w-12 text-yellow-500" />
            ) : data.nextLesson ? (
              <Link href={`/my-courses/${data.nextLesson.curriculumId}/lessons/${data.nextLesson.lessonId}`}>
                <Button size="lg" className="gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${data.overallPct}%` }}
            />
          </div>
          {data.nextLesson && (
            <p className="mt-2 text-xs text-muted-foreground">
              Next up: <span className="font-medium">{data.nextLesson.lessonTitle}</span> in {data.nextLesson.courseName}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Course Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Courses</h2>
          <Link href="/my-program/checksheet">
            <Button variant="outline" size="sm">
              <CheckSquare className="mr-2 h-4 w-4" />
              Full Checksheet
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.courses.map((course) => {
            const { label, cls } = statusLabel(course.progressPct);
            return (
              <Link key={course.curriculumId} href={`/my-courses/${course.curriculumId}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                        <CardTitle className="text-base">{course.name}</CardTitle>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
                    </div>
                    {course.subject && <CardDescription>{course.subject}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {course.completedLessons}/{course.totalLessons} lessons
                      </span>
                      <span className="font-medium">{course.progressPct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-full rounded-full transition-all ${statusColor(course.progressPct)}`}
                        style={{ width: `${course.progressPct}%` }}
                      />
                    </div>
                    {!course.isRequired && (
                      <p className="mt-1 text-xs text-muted-foreground">Optional</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

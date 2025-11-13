"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Clock } from "lucide-react";

interface Curriculum {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  grade: number | null;
  provider: string | null;
  units: Array<{
    id: string;
    lessons: Array<{ id: string }>;
  }>;
}

interface CourseCatalogProps {
  availableCurricula: Curriculum[];
  studentId: string;
}

export function CourseCatalog({ availableCurricula, studentId }: CourseCatalogProps) {
  const router = useRouter();
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const handleEnroll = async (curriculumId: string) => {
    setEnrolling(curriculumId);

    try {
      const response = await fetch("/api/student/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          curriculumId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to enroll");
      }

      // Redirect to the newly enrolled course
      router.push(`/my-courses/${curriculumId}`);
      router.refresh();
    } catch (error) {
      console.error("Enrollment error:", error);
      alert("Failed to enroll in course. Please try again.");
    } finally {
      setEnrolling(null);
    }
  };

  if (availableCurricula.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Courses Available</CardTitle>
          <CardDescription>
            There are no new courses available at this time. Check back later!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You may have already enrolled in all available courses.{" "}
            <a href="/my-courses" className="text-primary hover:underline">
              View your enrolled courses →
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {availableCurricula.map((curriculum) => {
        const totalLessons = curriculum.units.reduce(
          (acc, unit) => acc + unit.lessons.length,
          0
        );
        const isEnrolling = enrolling === curriculum.id;

        return (
          <Card key={curriculum.id} className="flex flex-col">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                {curriculum.grade && (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                    Grade {curriculum.grade}
                  </span>
                )}
              </div>
              <CardTitle className="line-clamp-2">{curriculum.name}</CardTitle>
              {curriculum.description && (
                <CardDescription className="line-clamp-3">
                  {curriculum.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between">
              <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                {curriculum.subject && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{curriculum.subject}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{totalLessons} lessons</span>
                </div>
                {curriculum.provider && (
                  <div className="text-xs">
                    Provider: {curriculum.provider}
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleEnroll(curriculum.id)}
                disabled={isEnrolling}
                className="w-full"
              >
                {isEnrolling ? "Enrolling..." : "Enroll Now"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

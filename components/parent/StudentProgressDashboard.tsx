"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  BookOpen,
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Sparkles,
  Loader2,
  MessageSquare,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { AIProgressInsights } from "./AIProgressInsights";
import { UnenrollButton } from "../student/UnenrollButton";

interface StudentProgressDashboardProps {
  student: any;
}

export function StudentProgressDashboard({ student }: StudentProgressDashboardProps) {
  // Calculate aggregate stats
  const totalEnrollments = student.enrollments.length;
  const totalAttempts = student.attempts.length;

  const scores = student.attempts.map((a: any) => a.score);
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
    : 0;

  const recentAttempts = student.attempts.slice(0, 10);
  const recentScores = recentAttempts.map((a: any) => a.score);
  const recentAvg = recentScores.length > 0
    ? Math.round(recentScores.reduce((a: number, b: number) => a + b, 0) / recentScores.length)
    : 0;

  const isImproving = recentAvg > avgScore;

  // Calculate progress per curriculum
  const curriculaProgress = student.enrollments.map((enrollment: any) => {
    const curriculum = enrollment.curriculum;
    const currentLessonIds = new Set(
      curriculum.units.flatMap((unit: any) =>
        unit.lessons.map((l: any) => l.id)
      )
    );
    const totalLessons = currentLessonIds.size;

    const progress = enrollment.progress as any || {};
    const completedLessons = Object.entries(progress).filter(
      ([id, p]: [string, any]) => currentLessonIds.has(id) && p.completed
    ).length;

    const lessonsAttempts = student.attempts.filter((attempt: any) =>
      curriculum.units.some((unit: any) =>
        unit.lessons.some((lesson: any) => lesson.id === attempt.lessonId)
      )
    );

    const curriculumScores = lessonsAttempts.map((a: any) => a.score);
    const curriculumAvg = curriculumScores.length > 0
      ? Math.round(
          curriculumScores.reduce((a: number, b: number) => a + b, 0) /
            curriculumScores.length
        )
      : 0;

    return {
      enrollmentId: enrollment.id,
      id: curriculum.id,
      name: curriculum.name,
      subject: curriculum.subject,
      totalLessons,
      completedLessons,
      percentComplete: totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0,
      avgScore: curriculumAvg,
      attemptCount: lessonsAttempts.length,
    };
  });

  // Build program stats from most recent enrollment
  const latestProgramEnrollment = student.programEnrollments?.[0] ?? null;
  const programStats = latestProgramEnrollment ? (() => {
    const program = latestProgramEnrollment.program;
    // Build a map of curriculumId -> completion % from existing enrollments
    const enrollmentBycurriculum = new Map(
      student.enrollments.map((e: any) => [e.curriculumId, e])
    );
    const courses = program.programCourses.map((pc: any) => {
      const curriculum = pc.curriculum;
      const enrollment = enrollmentBycurriculum.get(curriculum.id);
      const allLessonIds = new Set(
        curriculum.units.flatMap((u: any) => u.lessons.map((l: any) => l.id))
      );
      const totalLessons = allLessonIds.size;
      let completedLessons = 0;
      if (enrollment) {
        const progress = (enrollment.progress as any) || {};
        completedLessons = Object.entries(progress).filter(
          ([id, p]: [string, any]) => allLessonIds.has(id) && p.completed
        ).length;
      }
      const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      return { id: curriculum.id, name: curriculum.name, subject: curriculum.subject, totalLessons, completedLessons, pct, isRequired: pc.isRequired };
    });
    const totalLessons = courses.reduce((s: number, c: any) => s + c.totalLessons, 0);
    const completedLessons = courses.reduce((s: number, c: any) => s + c.completedLessons, 0);
    const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return { program, courses, totalLessons, completedLessons, overallPct };
  })() : null;

  // Get performance level
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "text-green-600", bgColor: "bg-green-100" };
    if (score >= 80) return { label: "Good", color: "text-blue-600", bgColor: "bg-blue-100" };
    if (score >= 70) return { label: "Fair", color: "text-yellow-600", bgColor: "bg-yellow-100" };
    return { label: "Needs Attention", color: "text-red-600", bgColor: "bg-red-100" };
  };

  const performance = getPerformanceLevel(avgScore);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/students">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{student.name}'s Progress</h1>
            <p className="text-muted-foreground">
              {student.user?.email || "No account linked"}
              {student.grade && ` • Grade ${student.grade}`}
            </p>
          </div>
          {avgScore > 0 && (
            <Badge className={`${performance.bgColor} ${performance.color} border-0 px-4 py-2 text-base`}>
              {performance.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Enrolled Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEnrollments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {totalAttempts} {totalAttempts === 1 ? 'attempt' : 'attempts'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {isImproving ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              Recent Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${isImproving ? 'text-green-600' : 'text-orange-600'}`}>
              {recentAvg}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 10 attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Completed Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {curriculaProgress.reduce((sum: number, c: any) => sum + c.completedLessons, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {curriculaProgress.reduce((sum: number, c: any) => sum + c.totalLessons, 0)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Progress Insights */}
      <div className="mb-8">
        <AIProgressInsights
          studentId={student.id}
          studentName={student.name}
          stats={{
            totalEnrollments,
            totalAttempts,
            avgScore,
            recentAvg,
            curriculaProgress,
          }}
        />
      </div>

      {/* Year Program */}
      {programStats && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                  {programStats.program.name}
                </CardTitle>
                <CardDescription>{programStats.program.academicYear} · Year Program</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{programStats.overallPct}%</div>
                <p className="text-xs text-muted-foreground">{programStats.completedLessons}/{programStats.totalLessons} lessons</p>
              </div>
            </div>
            <Progress value={programStats.overallPct} className="h-3 mt-3" />
          </CardHeader>
          <CardContent className="space-y-4">
            {programStats.courses.map((course: any) => (
              <div key={course.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{course.name}</span>
                    {course.subject && <span className="text-muted-foreground">· {course.subject}</span>}
                    {!course.isRequired && <span className="text-xs text-muted-foreground">(optional)</span>}
                  </div>
                  <span className="text-muted-foreground">{course.completedLessons}/{course.totalLessons} · {course.pct}%</span>
                </div>
                <Progress value={course.pct} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Course Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Course Progress</CardTitle>
          <CardDescription>Detailed breakdown by curriculum</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {curriculaProgress.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No courses enrolled yet
            </p>
          ) : (
            curriculaProgress.map((course: any) => (
              <div key={course.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{course.name}</h3>
                      {course.subject && (
                        <Badge variant="secondary" className="text-xs">
                          {course.subject}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {course.completedLessons} of {course.totalLessons} lessons completed
                      {course.avgScore > 0 && ` • ${course.avgScore}% average`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{course.percentComplete}%</div>
                    </div>
                    <UnenrollButton
                      enrollmentId={course.enrollmentId}
                      studentName={student.name}
                      courseName={course.name}
                      completedLessons={course.completedLessons}
                      totalLessons={course.totalLessons}
                    />
                  </div>
                </div>
                <Progress value={course.percentComplete} className="h-3" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 10 lesson attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAttempts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentAttempts.map((attempt: any) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="font-medium">{attempt.lesson.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {attempt.lesson.unit.curriculum.name} • {new Date(attempt.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {attempt.earned}/{attempt.maxScore} pts
                      </div>
                      <div className={`text-lg font-bold ${
                        attempt.score >= 80 ? 'text-green-600' :
                        attempt.score >= 70 ? 'text-blue-600' :
                        'text-orange-600'
                      }`}>
                        {attempt.score}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

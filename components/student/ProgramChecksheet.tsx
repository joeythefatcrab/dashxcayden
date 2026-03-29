"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, ChevronDown, ChevronRight, CheckCircle2, Circle, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type Lesson = {
  id: string; title: string; order: number;
  lessonType: string; isOffline: boolean;
  completed: boolean; completedAt: string | null;
};
type Unit = { id: string; title: string; lessons: Lesson[]; completedCount: number; totalCount: number };
type Course = {
  curriculumId: string; name: string; subject: string | null; isRequired: boolean;
  units: Unit[]; completedCount: number; totalCount: number;
};
type ChecksheetData = {
  program: { id: string; name: string; academicYear: string };
  studentId: string;
  totalLessons: number; totalCompleted: number; overallPct: number;
  courses: Course[];
};

interface Props {
  studentId?: string;
  programId?: string;
}

export function ProgramChecksheet({ studentId, programId }: Props) {
  const [data, setData] = useState<ChecksheetData | null | "loading">("loading");
  const [openCourses, setOpenCourses] = useState<Set<string>>(new Set());
  const [openUnits, setOpenUnits] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (studentId) params.set("studentId", studentId);
    if (programId) params.set("programId", programId);
    fetch(`/api/student/program-checksheet?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d?.courses) {
          // Expand all by default
          setOpenCourses(new Set(d.courses.map((c: Course) => c.curriculumId)));
          setOpenUnits(new Set(d.courses.flatMap((c: Course) => c.units.map((u: Unit) => u.id))));
        }
      })
      .catch(() => setData(null));
  }, [studentId, programId]);

  const toggleCourse = (id: string) => {
    setOpenCourses((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleUnit = (id: string) => {
    setOpenUnits((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePrint = () => window.print();

  if (data === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-muted-foreground">No program data found.</p>
        <Link href="/my-program"><Button className="mt-4">Back to Program</Button></Link>
      </div>
    );
  }

  const courseStatusCls = (pct: number) =>
    pct === 100 ? "text-green-600" : pct > 0 ? "text-primary" : "text-muted-foreground";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header — hidden when printing via print:hidden */}
      <div className="print:hidden mb-6 flex items-center justify-between">
        <div>
          <Link href="/my-program" className="text-sm text-muted-foreground hover:text-foreground">← Back to Program</Link>
          <h1 className="text-2xl font-bold mt-1">{data.program.name} — Check Sheet</h1>
          <p className="text-muted-foreground">{data.program.academicYear} · {data.totalCompleted}/{data.totalLessons} lessons complete ({data.overallPct}%)</p>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Print header — only shown when printing */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">{data.program.name}</h1>
        <p className="text-base">{data.program.academicYear} — Completion Check Sheet</p>
        <p className="text-sm">{data.totalCompleted}/{data.totalLessons} lessons complete</p>
      </div>

      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Overall</span>
          <span className="font-medium">{data.overallPct}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden print:border print:border-gray-400">
          <div className="h-full bg-primary rounded-full" style={{ width: `${data.overallPct}%` }} />
        </div>
      </div>

      {/* Course tree */}
      <div ref={printRef} className="space-y-3">
        {data.courses.map((course) => {
          const courseOpen = openCourses.has(course.curriculumId);
          const coursePct = course.totalCount > 0 ? Math.round((course.completedCount / course.totalCount) * 100) : 0;

          return (
            <div key={course.curriculumId} className="rounded-lg border overflow-hidden print:border-gray-300">
              {/* Course row */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 hover:bg-muted text-left print:bg-gray-100 print:pointer-events-none"
                onClick={() => toggleCourse(course.curriculumId)}
              >
                <span className="print:hidden">
                  {courseOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                </span>
                <span className={`shrink-0 ${courseStatusCls(coursePct)}`}>
                  {coursePct === 100
                    ? <CheckCircle2 className="h-5 w-5" />
                    : <span className="text-xs font-mono font-bold">{coursePct}%</span>}
                </span>
                <span className="flex-1 font-semibold">{course.name}</span>
                <span className="text-sm text-muted-foreground">{course.completedCount}/{course.totalCount}</span>
                {!course.isRequired && <span className="text-xs text-muted-foreground">(optional)</span>}
              </button>

              {(courseOpen || typeof window === "undefined") && (
                <div className="divide-y">
                  {course.units.map((unit) => {
                    const unitOpen = openUnits.has(unit.id);
                    const unitPct = unit.totalCount > 0 ? Math.round((unit.completedCount / unit.totalCount) * 100) : 0;

                    return (
                      <div key={unit.id}>
                        {/* Unit row */}
                        <button
                          className="w-full flex items-center gap-3 px-6 py-2 hover:bg-muted/30 text-left print:pointer-events-none"
                          onClick={() => toggleUnit(unit.id)}
                        >
                          <span className="print:hidden">
                            {unitOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                          </span>
                          <span className={`shrink-0 text-sm ${unitPct === 100 ? "text-green-500" : "text-muted-foreground"}`}>
                            {unitPct === 100 ? "✅" : `${unit.completedCount}/${unit.totalCount}`}
                          </span>
                          <span className="flex-1 text-sm font-medium">{unit.title}</span>
                        </button>

                        {(unitOpen || typeof window === "undefined") && (
                          <div className="px-8 pb-2 space-y-1">
                            {unit.lessons.map((lesson) => (
                              <div key={lesson.id} className="flex items-center gap-2 py-1 text-sm">
                                {lesson.completed
                                  ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                                  : <Circle className="h-4 w-4 shrink-0 text-gray-300" />}
                                <span className={lesson.completed ? "text-muted-foreground line-through" : ""}>
                                  {lesson.title}
                                </span>
                                {lesson.isOffline && (
                                  <WifiOff className="h-3 w-3 text-muted-foreground" title="Offline lesson" />
                                )}
                                {lesson.completed && lesson.completedAt && (
                                  <span className="ml-auto text-xs text-muted-foreground print:inline hidden">
                                    {formatDistanceToNow(new Date(lesson.completedAt), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:inline { display: inline !important; }
        }
      `}</style>
    </div>
  );
}

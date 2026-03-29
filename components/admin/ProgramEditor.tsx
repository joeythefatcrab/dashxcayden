"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Plus, UserPlus, CheckSquare, BookOpen } from "lucide-react";
import Link from "next/link";

type Curriculum = { id: string; name: string; subject: string | null; grade: number | null };
type StudentOption = { id: string; name: string; grade: number | null };
type ProgramCourse = {
  id: string; curriculumId: string; order: number; isRequired: boolean;
  curriculum: Curriculum & { units: { lessons: { id: string }[] }[] };
};
type ProgramEnrollment = { id: string; studentId: string; student: StudentOption };
type Program = {
  id: string; name: string; description: string | null; academicYear: string; isActive: boolean;
  programCourses: ProgramCourse[];
  enrollments: ProgramEnrollment[];
};

interface Props {
  program: Program;
  allCurricula: Curriculum[];
  allStudents: StudentOption[];
}

export function ProgramEditor({ program: initial, allCurricula, allStudents }: Props) {
  const router = useRouter();
  const [program, setProgram] = useState(initial);
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaName, setMetaName] = useState(initial.name);
  const [metaYear, setMetaYear] = useState(initial.academicYear);
  const [metaDesc, setMetaDesc] = useState(initial.description ?? "");
  const [addingCourse, setAddingCourse] = useState(false);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");
  const [enrollingStudent, setEnrollingStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [saving, setSaving] = useState(false);

  const enrolledCurriculumIds = new Set(program.programCourses.map((pc) => pc.curriculumId));
  const enrolledStudentIds = new Set(program.enrollments.map((e) => e.studentId));
  const availableCurricula = allCurricula.filter((c) => !enrolledCurriculumIds.has(c.id));
  const availableStudents = allStudents.filter((s) => !enrolledStudentIds.has(s.id));

  const reload = async () => {
    const res = await fetch(`/api/admin/programs/${program.id}`);
    if (res.ok) setProgram(await res.json());
  };

  const saveMeta = async () => {
    setSaving(true);
    await fetch(`/api/admin/programs/${program.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: metaName, academicYear: metaYear, description: metaDesc, isActive: program.isActive }),
    });
    setEditingMeta(false);
    await reload();
    setSaving(false);
  };

  const addCourse = async () => {
    if (!selectedCurriculumId) return;
    setSaving(true);
    await fetch(`/api/admin/programs/${program.id}/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curriculumId: selectedCurriculumId }),
    });
    setSelectedCurriculumId("");
    setAddingCourse(false);
    await reload();
    setSaving(false);
  };

  const removeCourse = async (programCourseId: string) => {
    if (!confirm("Remove this course from the program?")) return;
    await fetch(`/api/admin/programs/${program.id}/courses`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programCourseId }),
    });
    await reload();
  };

  const toggleRequired = async (programCourseId: string, isRequired: boolean) => {
    await fetch(`/api/admin/programs/${program.id}/courses`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programCourseId, isRequired }),
    });
    await reload();
  };

  const moveCourse = async (index: number, direction: -1 | 1) => {
    const courses = [...program.programCourses];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= courses.length) return;
    [courses[index], courses[newIndex]] = [courses[newIndex], courses[index]];
    const orderedIds = courses.map((c) => c.id);
    await fetch(`/api/admin/programs/${program.id}/courses`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
    await reload();
  };

  const enrollStudent = async () => {
    if (!selectedStudentId) return;
    setSaving(true);
    await fetch(`/api/admin/programs/${program.id}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: selectedStudentId }),
    });
    setSelectedStudentId("");
    setEnrollingStudent(false);
    await reload();
    setSaving(false);
  };

  const unenrollStudent = async (studentId: string) => {
    if (!confirm("Remove this student from the program?")) return;
    await fetch(`/api/admin/programs/${program.id}/enroll`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    await reload();
  };

  const deleteProgram = async () => {
    if (!confirm(`Delete "${program.name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/programs/${program.id}`, { method: "DELETE" });
    router.push("/programs");
    router.refresh();
  };

  const totalLessons = program.programCourses.reduce(
    (s, pc) => s + pc.curriculum.units.reduce((u, un) => u + un.lessons.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/programs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Programs
          </Button>
        </Link>
      </div>

      {/* Program Meta */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              {editingMeta ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input value={metaName} onChange={(e) => setMetaName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Academic Year</Label>
                      <Input value={metaYear} onChange={(e) => setMetaYear(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveMeta} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingMeta(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-2xl">{program.name}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-3">
                    <Badge variant="outline">{program.academicYear}</Badge>
                    <span>{program.programCourses.length} courses</span>
                    <span>{totalLessons} total lessons</span>
                    <span>{program.enrollments.length} students enrolled</span>
                  </CardDescription>
                  {program.description && <p className="mt-2 text-sm text-muted-foreground">{program.description}</p>}
                </>
              )}
            </div>
            {!editingMeta && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingMeta(true)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={deleteProgram}>Delete</Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Courses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Courses ({program.programCourses.length})
              </CardTitle>
              <Button size="sm" onClick={() => setAddingCourse(!addingCourse)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Course
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {addingCourse && (
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                <Select value={selectedCurriculumId} onValueChange={setSelectedCurriculumId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurricula.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.subject ? ` — ${c.subject}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addCourse} disabled={!selectedCurriculumId || saving}>
                    {saving ? "Adding..." : "Add"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAddingCourse(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {program.programCourses.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No courses yet. Add courses above.</p>
            )}

            {program.programCourses.map((pc, index) => {
              const lessonCount = pc.curriculum.units.reduce((s, u) => s + u.lessons.length, 0);
              return (
                <div key={pc.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveCourse(index, -1)} disabled={index === 0}>
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveCourse(index, 1)} disabled={index === program.programCourses.length - 1}>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="w-5 text-xs text-muted-foreground font-mono">{index + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{pc.curriculum.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pc.curriculum.subject ?? "No subject"} · {lessonCount} lessons
                    </p>
                  </div>
                  <button
                    onClick={() => toggleRequired(pc.id, !pc.isRequired)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      pc.isRequired ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-muted-foreground/20"
                    }`}
                  >
                    {pc.isRequired ? "Required" : "Optional"}
                  </button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeCourse(pc.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Students */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Enrolled Students ({program.enrollments.length})
              </CardTitle>
              <Button size="sm" onClick={() => setEnrollingStudent(!enrollingStudent)}>
                <Plus className="mr-1 h-4 w-4" />
                Enroll Student
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {enrollingStudent && (
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}{s.grade ? ` (Grade ${s.grade})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This will also enroll them in all {program.programCourses.length} courses automatically.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={enrollStudent} disabled={!selectedStudentId || saving}>
                    {saving ? "Enrolling..." : "Enroll"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEnrollingStudent(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {program.enrollments.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No students enrolled yet.</p>
            )}

            {program.enrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{e.student.name}</p>
                  {e.student.grade && <p className="text-xs text-muted-foreground">Grade {e.student.grade}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/my-program?studentId=${e.studentId}`} className="text-xs text-primary hover:underline">
                    View Progress
                  </Link>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => unenrollStudent(e.studentId)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick link to checksheet */}
      {program.enrollments.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">View check sheets for enrolled students</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {program.enrollments.slice(0, 5).map((e) => (
                  <Link key={e.id} href={`/my-program/checksheet?studentId=${e.studentId}&programId=${program.id}`}>
                    <Button size="sm" variant="outline">{e.student.name}</Button>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

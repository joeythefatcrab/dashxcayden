"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, BookOpen, Trash2, BarChart } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  grade: number | null;
  user: { email: string } | null;
  enrollments: Array<{
    curriculum: {
      id: string;
      name: string;
      subject: string | null;
    };
  }>;
}

interface Curriculum {
  id: string;
  name: string;
  subject: string | null;
  grade: number | null;
  description: string | null;
}

interface StudentManagerProps {
  students: Student[];
  curricula: Curriculum[];
}

export function StudentManager({ students, curricula }: StudentManagerProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create student form state
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentGrade, setStudentGrade] = useState("");
  const [selectedCurricula, setSelectedCurricula] = useState<string[]>([]);

  const handleCreateStudent = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/parent/create-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: studentName,
          email: studentEmail,
          password: studentPassword,
          grade: studentGrade ? parseInt(studentGrade) : null,
          curriculaIds: selectedCurricula,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create student");
      }

      setSuccess(`Student ${studentName} created successfully!`);

      // Reset form
      setStudentName("");
      setStudentEmail("");
      setStudentPassword("");
      setStudentGrade("");
      setSelectedCurricula([]);

      // Close dialog after a moment
      setTimeout(() => {
        setIsCreateDialogOpen(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCurriculum = (curriculumId: string) => {
    setSelectedCurricula((prev) =>
      prev.includes(curriculumId)
        ? prev.filter((id) => id !== curriculumId)
        : [...prev, curriculumId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Create Student Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Student Account
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Student Account</DialogTitle>
            <DialogDescription>
              Create a new student account with email and password. You can enroll them in courses immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Student Name *</Label>
              <Input
                id="name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="John Doe"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="student@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                placeholder="Set a password"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="grade">Grade (optional)</Label>
              <Input
                id="grade"
                type="number"
                value={studentGrade}
                onChange={(e) => setStudentGrade(e.target.value)}
                placeholder="e.g. 8"
                disabled={isLoading}
              />
            </div>

            {curricula.length > 0 && (
              <div>
                <Label>Enroll in Courses (optional)</Label>
                <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                  {curricula.map((curriculum) => (
                    <div key={curriculum.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`curriculum-${curriculum.id}`}
                        checked={selectedCurricula.includes(curriculum.id)}
                        onCheckedChange={() => handleToggleCurriculum(curriculum.id)}
                        disabled={isLoading}
                      />
                      <label
                        htmlFor={`curriculum-${curriculum.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {curriculum.name}
                        {curriculum.subject && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({curriculum.subject})
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateStudent}
              disabled={isLoading || !studentName || !studentEmail || !studentPassword}
            >
              {isLoading ? "Creating..." : "Create Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Students List */}
      <div className="grid gap-4">
        {students.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Students Yet</CardTitle>
              <CardDescription>
                Create your first student account to get started
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          students.map((student) => (
            <Card key={student.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{student.name}</CardTitle>
                    <CardDescription>
                      {student.user?.email || "No email set"}
                      {student.grade && ` • Grade ${student.grade}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {student.enrollments.length > 0 ? (
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-medium">Enrolled in:</p>
                    <div className="flex flex-wrap gap-2">
                      {student.enrollments.map((enrollment) => (
                        <Badge key={enrollment.curriculum.id} variant="secondary">
                          <BookOpen className="mr-1 h-3 w-3" />
                          {enrollment.curriculum.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">Not enrolled in any courses yet</p>
                )}

                <Link href={`/students/${student.id}`}>
                  <Button variant="outline" className="w-full">
                    <BarChart className="mr-2 h-4 w-4" />
                    View Detailed Progress
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

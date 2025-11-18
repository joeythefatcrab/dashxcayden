"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  BookOpen,
  Mail,
  Calendar,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Trash2,
  Plus,
} from "lucide-react";

type Parent = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  children: Array<{
    id: string;
    name: string;
    grade: number | null;
    enrollments: Array<{
      curriculum: {
        name: string;
      };
    }>;
  }>;
  _count: {
    children: number;
    curricula: number;
  };
};

type ParentManagerProps = {
  parents: Parent[];
};

export function ParentManager({ parents: initialParents }: ParentManagerProps) {
  const router = useRouter();
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [isAddParentOpen, setIsAddParentOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Parent form state
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPassword, setParentPassword] = useState("");

  // Student form state
  const [studentName, setStudentName] = useState("");
  const [studentGrade, setStudentGrade] = useState("");

  const toggleParent = (parentId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parentName,
          email: parentEmail,
          password: parentPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create parent");
      }

      // Reset form
      setParentName("");
      setParentEmail("");
      setParentPassword("");
      setIsAddParentOpen(false);

      // Refresh the page to show new parent
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create parent");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteParent = async (parentId: string, parentName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${parentName || "this parent"}? This will also delete all their students and cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/parents/${parentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete parent");
      }

      // Refresh the page
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete parent");
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentId) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: studentName,
          parentId: selectedParentId,
          grade: studentGrade ? parseInt(studentGrade) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create student");
      }

      // Reset form
      setStudentName("");
      setStudentGrade("");
      setSelectedParentId(null);
      setIsAddStudentOpen(false);

      // Refresh the page
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create student");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${studentName}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete student");
      }

      // Refresh the page
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete student");
    }
  };

  if (initialParents.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Parents Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Parent accounts will appear here when they are added to your administration.
        </p>
        <Dialog open={isAddParentOpen} onOpenChange={setIsAddParentOpen}>
          <DialogTrigger asChild>
            <Button className="mt-6">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Parent Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddParent}>
              <DialogHeader>
                <DialogTitle>Add New Parent Account</DialogTitle>
                <DialogDescription>
                  Create a new parent account that you'll manage.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Parent Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="parent@example.com"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Choose a strong password"
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddParentOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Parent"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Total Parents</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{initialParents.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Total Students</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {initialParents.reduce((sum, p) => sum + p._count.children, 0)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium">Total Curricula</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {initialParents.reduce((sum, p) => sum + p._count.curricula, 0)}
          </p>
        </div>
      </div>

      {/* Add Parent Button */}
      <div className="flex justify-end">
        <Dialog open={isAddParentOpen} onOpenChange={setIsAddParentOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Parent Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddParent}>
              <DialogHeader>
                <DialogTitle>Add New Parent Account</DialogTitle>
                <DialogDescription>
                  Create a new parent account that you'll manage.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Parent Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="parent@example.com"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Choose a strong password"
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddParentOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Parent"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Parent List */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Parent Accounts</h2>
        </div>
        <div className="divide-y">
          {initialParents.map((parent) => {
            const isExpanded = expandedParents.has(parent.id);
            return (
              <div key={parent.id} className="p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleParent(parent.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {parent.name || "Unnamed Parent"}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {parent._count.children}{" "}
                          {parent._count.children === 1 ? "student" : "students"}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {parent.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined{" "}
                          {new Date(parent.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteParent(parent.id, parent.name || parent.email)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded: Show Students */}
                {isExpanded && (
                  <div className="ml-8 mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Students</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedParentId(parent.id);
                          setIsAddStudentOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Add Student
                      </Button>
                    </div>
                    {parent.children.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No students added yet.
                      </p>
                    ) : (
                      parent.children.map((student) => (
                        <div
                          key={student.id}
                          className="rounded-md border bg-muted/50 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{student.name}</h4>
                              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                {student.grade && (
                                  <Badge variant="secondary" className="text-xs">
                                    Grade {student.grade}
                                  </Badge>
                                )}
                                <span>
                                  {student.enrollments.length}{" "}
                                  {student.enrollments.length === 1
                                    ? "course"
                                    : "courses"}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteStudent(student.id, student.name)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          {student.enrollments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                Enrolled in:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {student.enrollments.map((enrollment, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {enrollment.curriculum.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
        <DialogContent>
          <form onSubmit={handleAddStudent}>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Add a student to this parent's account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="student-name">Student Name *</Label>
                <Input
                  id="student-name"
                  placeholder="Student's full name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-grade">Grade (optional)</Label>
                <Input
                  id="student-grade"
                  type="number"
                  placeholder="e.g., 8"
                  min="1"
                  max="12"
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                />
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddStudentOpen(false);
                  setSelectedParentId(null);
                  setStudentName("");
                  setStudentGrade("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Student"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

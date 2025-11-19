"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { UserPlus, Users } from "lucide-react";

type Student = {
  id: string;
  name: string;
  grade: number | null;
};

type AssignCurriculumDialogProps = {
  curriculumId: string;
  curriculumName: string;
  students: Student[];
  assignedStudentIds?: string[];
};

export function AssignCurriculumDialog({
  curriculumId,
  curriculumName,
  students,
  assignedStudentIds = [],
}: AssignCurriculumDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(assignedStudentIds);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState("");

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleToggleAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const handleAssign = async () => {
    if (selectedStudentIds.length === 0) {
      setError("Please select at least one student");
      return;
    }

    setIsAssigning(true);
    setError("");

    try {
      const response = await fetch("/api/curricula/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curriculumId,
          studentIds: selectedStudentIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign curriculum");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign curriculum");
    } finally {
      setIsAssigning(false);
    }
  };

  if (students.length === 0) {
    return (
      <Button variant="outline" disabled>
        <UserPlus className="mr-2 h-4 w-4" />
        No Students Available
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Assign to Students
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Curriculum to Students</DialogTitle>
          <DialogDescription>
            Select which students should have access to "{curriculumName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Select All */}
          <div className="flex items-center gap-2 border-b pb-3">
            <Checkbox
              id="select-all"
              checked={selectedStudentIds.length === students.length}
              onCheckedChange={handleToggleAll}
            />
            <Label htmlFor="select-all" className="font-medium cursor-pointer">
              Select All ({students.length} students)
            </Label>
          </div>

          {/* Student List */}
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50"
              >
                <Checkbox
                  id={student.id}
                  checked={selectedStudentIds.includes(student.id)}
                  onCheckedChange={() => handleToggleStudent(student.id)}
                />
                <Label
                  htmlFor={student.id}
                  className="flex-1 cursor-pointer text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{student.name}</span>
                    {student.grade && (
                      <span className="text-xs text-muted-foreground">
                        Grade {student.grade}
                      </span>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </div>

          {/* Selection Summary */}
          {selectedStudentIds.length > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-primary">
                {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? "s" : ""} selected
              </span>
            </div>
          )}

          {/* Error Message */}
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
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isAssigning || selectedStudentIds.length === 0}>
            {isAssigning ? "Assigning..." : `Assign to ${selectedStudentIds.length} Student${selectedStudentIds.length > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

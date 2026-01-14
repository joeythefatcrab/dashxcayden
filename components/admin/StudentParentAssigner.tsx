"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus, Search } from "lucide-react";
import { useRouter } from "next/navigation";

type Student = {
  id: string;
  name: string;
  user: { id: string; email: string; name: string | null } | null;
  parent: { id: string; name: string | null; email: string } | null;
};

type Parent = {
  id: string;
  name: string | null;
  email: string;
};

type Props = {
  students: Student[];
  parents: Parent[];
};

export function StudentParentAssigner({ students, parents }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isAssigning, setIsAssigning] = useState<string | null>(null);

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.user?.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async (studentId: string, parentId: string) => {
    if (!parentId) return;

    setIsAssigning(studentId);
    try {
      const response = await fetch("/api/admin/assign-student-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, parentId }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign student");
      }

      alert("Student assigned successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error assigning student:", error);
      alert("Failed to assign student. Please try again.");
    } finally {
      setIsAssigning(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Student List */}
      <div className="grid gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle className="text-lg">{student.name}</CardTitle>
              {student.user && (
                <p className="text-sm text-muted-foreground">
                  {student.user.email}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Current Parent: {student.parent?.name || student.parent?.email || "None"}
                  </label>
                  <Select
                    defaultValue={student.parent?.id}
                    onValueChange={(parentId) => handleAssign(student.id, parentId)}
                    disabled={isAssigning === student.id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parent" />
                    </SelectTrigger>
                    <SelectContent>
                      {parents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.name || parent.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isAssigning === student.id && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredStudents.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No students found matching your search.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

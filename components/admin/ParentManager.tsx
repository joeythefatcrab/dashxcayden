"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  Mail,
  Calendar,
  ChevronDown,
  ChevronRight,
  UserPlus
} from "lucide-react";

type Parent = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
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

export function ParentManager({ parents }: ParentManagerProps) {
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  const toggleParent = (parentId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  if (parents.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Parents Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Parent accounts will appear here when they are added to your administration.
        </p>
        <Button className="mt-6">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Parent Account
        </Button>
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
          <p className="mt-2 text-2xl font-bold">{parents.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Total Students</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {parents.reduce((sum, p) => sum + p._count.children, 0)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium">Total Curricula</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {parents.reduce((sum, p) => sum + p._count.curricula, 0)}
          </p>
        </div>
      </div>

      {/* Parent List */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Parent Accounts</h2>
        </div>
        <div className="divide-y">
          {parents.map((parent) => {
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
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>

                {/* Expanded: Show Students */}
                {isExpanded && (
                  <div className="ml-8 mt-4 space-y-3">
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
    </div>
  );
}

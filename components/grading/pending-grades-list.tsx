"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";
import { GradingModal } from "./grading-modal";

interface GradingItem {
  itemId: string;
  answer: string;
  itemType: string;
  itemPrompt: string;
  maxPoints: number;
}

interface PendingGrade {
  attemptId: string;
  studentId: string;
  studentName: string;
  lessonId: string;
  lessonTitle: string;
  unitTitle: string;
  curriculumId: string;
  curriculumName: string;
  submittedAt: string;
  itemsNeedingGrading: GradingItem[];
}

export function PendingGradesList() {
  const [pendingGrades, setPendingGrades] = useState<PendingGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<PendingGrade | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPendingGrades = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/grading/pending");
      if (response.ok) {
        const data = await response.json();
        setPendingGrades(data.pendingGrades || []);
      }
    } catch (error) {
      console.error("Error fetching pending grades:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingGrades();
  }, []);

  const handleGradeClick = (grade: PendingGrade) => {
    setSelectedGrade(grade);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedGrade(null);
  };

  const handleGradeSubmitted = () => {
    fetchPendingGrades();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (pendingGrades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Assignments</CardTitle>
          <CardDescription>No assignments waiting to be graded</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All caught up! When students submit essays or written assignments, they'll appear here for grading.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Assignments</CardTitle>
              <CardDescription>
                {pendingGrades.length} {pendingGrades.length === 1 ? "assignment" : "assignments"} waiting to be graded
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-base">
              {pendingGrades.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingGrades.map((grade) => (
              <div
                key={grade.attemptId}
                className="flex items-start justify-between rounded-lg border p-4 hover:bg-accent"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{grade.studentName}</span>
                    <Badge variant="outline" className="text-xs">
                      {grade.itemsNeedingGrading.length} {grade.itemsNeedingGrading.length === 1 ? "item" : "items"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {grade.curriculumName} • {grade.lessonTitle}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Submitted {new Date(grade.submittedAt).toLocaleDateString()} at{" "}
                    {new Date(grade.submittedAt).toLocaleTimeString()}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleGradeClick(grade)}
                >
                  Grade
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <GradingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        pendingGrade={selectedGrade}
        onGradeSubmitted={handleGradeSubmitted}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";

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
  curriculumName: string;
  submittedAt: string;
  itemsNeedingGrading: GradingItem[];
}

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingGrade: PendingGrade | null;
  onGradeSubmitted: () => void;
}

export function GradingModal({ isOpen, onClose, pendingGrade, onGradeSubmitted }: GradingModalProps) {
  const [grades, setGrades] = useState<Record<string, { points: number; feedback: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!pendingGrade) return null;

  const handleGradeChange = (itemId: string, points: number) => {
    setGrades(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        points: Math.max(0, Math.min(points, pendingGrade.itemsNeedingGrading.find(i => i.itemId === itemId)?.maxPoints || 0)),
      }
    }));
  };

  const handleFeedbackChange = (itemId: string, feedback: string) => {
    setGrades(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        feedback,
      }
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/grading/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: pendingGrade.attemptId,
          grades,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit grades");
      }

      setSuccess(true);
      setTimeout(() => {
        onGradeSubmitted();
        onClose();
        setSuccess(false);
        setGrades({});
      }, 1500);
    } catch (error) {
      console.error("Error submitting grades:", error);
      alert("Failed to submit grades. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allItemsGraded = pendingGrade.itemsNeedingGrading.every(
    item => grades[item.itemId]?.points !== undefined
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grade Assignment</DialogTitle>
          <DialogDescription>
            Review and grade {pendingGrade.studentName}'s submission
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <p className="text-lg font-medium">Grades submitted successfully!</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div><strong>Student:</strong> {pendingGrade.studentName}</div>
                <div><strong>Course:</strong> {pendingGrade.curriculumName}</div>
                <div><strong>Unit:</strong> {pendingGrade.unitTitle}</div>
                <div><strong>Lesson:</strong> {pendingGrade.lessonTitle}</div>
                <div><strong>Submitted:</strong> {new Date(pendingGrade.submittedAt).toLocaleString()}</div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {pendingGrade.itemsNeedingGrading.map((item, idx) => (
                <Card key={item.itemId}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Question {idx + 1} • {item.itemType === "ESSAY" ? "Essay" : "Short Answer"}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {item.itemPrompt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Student's Answer:</Label>
                      <div className="mt-2 rounded-lg bg-muted p-4">
                        <p className="whitespace-pre-wrap text-sm">{item.answer}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`points-${item.itemId}`}>
                          Points (out of {item.maxPoints})
                        </Label>
                        <Input
                          id={`points-${item.itemId}`}
                          type="number"
                          min={0}
                          max={item.maxPoints}
                          value={grades[item.itemId]?.points ?? ""}
                          onChange={(e) =>
                            handleGradeChange(item.itemId, parseFloat(e.target.value) || 0)
                          }
                          placeholder="Enter points"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`feedback-${item.itemId}`}>
                          Feedback (optional)
                        </Label>
                        <Input
                          id={`feedback-${item.itemId}`}
                          value={grades[item.itemId]?.feedback ?? ""}
                          onChange={(e) =>
                            handleFeedbackChange(item.itemId, e.target.value)
                          }
                          placeholder="Add feedback"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!allItemsGraded || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Grades"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

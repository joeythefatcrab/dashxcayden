"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Submission = {
  id: string;
  content: string;
  status: "DRAFT" | "SUBMITTED" | "GRADED";
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  gradedAt: string | null;
  student: {
    id: string;
    name: string;
  };
  lessonId: string;
  itemId: string;
};

type Props = {
  onBack?: () => void;
};

export function EssayGrading({ onBack }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    loadPendingEssays();
  }, []);

  const loadPendingEssays = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/parent/pending-essays");
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Error loading pending essays:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeSubmit = async () => {
    if (!selectedSubmission) return;

    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      alert("Please enter a valid grade between 0 and 100");
      return;
    }

    setIsGrading(true);
    try {
      const response = await fetch("/api/parent/grade-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          grade: gradeNum,
          feedback: feedback.trim() || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to grade essay");

      alert("Essay graded successfully!");
      setSelectedSubmission(null);
      setGrade("");
      setFeedback("");
      loadPendingEssays();
    } catch (error) {
      console.error("Error grading essay:", error);
      alert("Failed to grade essay");
    } finally {
      setIsGrading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Show grading form if an essay is selected
  if (selectedSubmission) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedSubmission(null);
            setGrade("");
            setFeedback("");
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Grade Essay - {selectedSubmission.student.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Submitted {formatDistanceToNow(new Date(selectedSubmission.submittedAt!), { addSuffix: true })}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Essay Content */}
            <div>
              <h3 className="font-semibold mb-2">Essay Content:</h3>
              <div
                className="prose prose-sm max-w-none p-4 rounded-lg border bg-muted/30"
                dangerouslySetInnerHTML={{ __html: selectedSubmission.content }}
              />
            </div>

            {/* Grade Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Grade (0-100)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Enter grade percentage"
                className="max-w-xs"
              />
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Feedback (Optional)
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback for the student..."
                rows={6}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleGradeSubmit}
              disabled={isGrading || !grade.trim()}
            >
              {isGrading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Grade...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Grade
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show list of pending essays
  return (
    <div className="space-y-4">
      {onBack && (
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending Essays to Grade</CardTitle>
          <p className="text-sm text-muted-foreground">
            {submissions.length} {submissions.length === 1 ? "essay" : "essays"} waiting for grading
          </p>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No essays to grade at this time.
            </p>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{submission.student.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Submitted {formatDistanceToNow(new Date(submission.submittedAt!), { addSuffix: true })}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Grade Essay
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

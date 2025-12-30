"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "./RichTextEditor";
import { Loader2, Send, Save, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Props = {
  studentId: string;
  lessonId: string;
  itemId: string;
  prompt: string;
};

type Submission = {
  id: string;
  content: string;
  status: "DRAFT" | "SUBMITTED" | "GRADED";
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  gradedAt: string | null;
  updatedAt: string;
};

export function EssaySubmission({ studentId, lessonId, itemId, prompt }: Props) {
  const [content, setContent] = useState("");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    loadSubmission();
  }, [itemId]);

  const loadSubmission = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/student/essays?studentId=${studentId}&itemId=${itemId}`
      );

      if (response.ok) {
        const data = await response.json();
        setSubmission(data);
        setContent(data.content || "");
      }
    } catch (error) {
      console.error("Error loading submission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/student/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          lessonId,
          itemId,
          content,
          status: "DRAFT",
        }),
      });

      if (!response.ok) throw new Error("Failed to save draft");

      const data = await response.json();
      setSubmission(data);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert("Please write your essay before submitting");
      return;
    }

    if (!confirm("Submit your essay? You won't be able to edit it after submission.")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/student/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          lessonId,
          itemId,
          content,
          status: "SUBMITTED",
        }),
      });

      if (!response.ok) throw new Error("Failed to submit essay");

      const data = await response.json();
      setSubmission(data);
      alert("Essay submitted successfully!");
    } catch (error) {
      console.error("Error submitting essay:", error);
      alert("Failed to submit essay");
    } finally {
      setIsSubmitting(false);
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

  const isSubmitted = submission?.status === "SUBMITTED" || submission?.status === "GRADED";
  const isGraded = submission?.status === "GRADED";

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Essay Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: prompt }}
          />
        </CardContent>
      </Card>

      {/* Grade Display (if graded) */}
      {isGraded && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Grade: {submission.grade}%
                </h3>
                {submission.feedback && (
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                      Feedback:
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">
                      {submission.feedback}
                    </p>
                  </div>
                )}
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  Graded {formatDistanceToNow(new Date(submission.gradedAt!), { addSuffix: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Status */}
      {isSubmitted && !isGraded && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ✓ Submitted {formatDistanceToNow(new Date(submission.submittedAt!), { addSuffix: true })}
              {" "}- Waiting for grading
            </p>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Your Essay</CardTitle>
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Start writing your essay..."
            disabled={isSubmitted}
          />

          {!isSubmitted && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || !content.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </>
                )}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Essay
                  </>
                )}
              </Button>
            </div>
          )}

          {isSubmitted && (
            <div className="mt-4 p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                This essay has been submitted and cannot be edited.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

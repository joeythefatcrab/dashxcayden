"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, FileText, Loader2, Save, Send, CheckCircle } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { EssayWritingAssistant } from "./EssayWritingAssistant";

type EssaySubmission = {
  id: string;
  content: string;
  status: "DRAFT" | "SUBMITTED" | "GRADED";
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  aiGrade: number | null;
  aiSummary: string | null;
};

type Props = {
  studentId: string;
  lessonId: string;
  itemId: string;
  prompt: string;
  isOpen: boolean;
  onClose: () => void;
};

export function FloatingEssaySubmission({
  studentId,
  lessonId,
  itemId,
  prompt,
  isOpen,
  onClose,
}: Props) {
  const [content, setContent] = useState("");
  const [submission, setSubmission] = useState<EssaySubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSubmission();
    }
  }, [isOpen, studentId, itemId]);

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
      } else if (response.status === 404) {
        // No submission yet
        setSubmission(null);
        setContent("");
      }
    } catch (error) {
      console.error("Error loading essay:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      alert("Please write something before saving");
      return;
    }

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
          prompt,
        }),
      });

      if (!response.ok) throw new Error("Failed to save draft");

      const data = await response.json();
      setSubmission(data);
      alert("Draft saved!");
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

    if (
      !confirm(
        "Submit your essay? You won't be able to edit it after submission, and it will be automatically graded by AI."
      )
    ) {
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
          prompt,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit essay");

      const data = await response.json();
      setSubmission(data);
      alert(
        "Essay submitted successfully! It will be graded by AI and sent to your parent for review."
      );
    } catch (error) {
      console.error("Error submitting essay:", error);
      alert("Failed to submit essay");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isSubmitted =
    submission?.status === "SUBMITTED" || submission?.status === "GRADED";
  const isGraded = submission?.status === "GRADED";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Essay Assignment</CardTitle>
                {submission?.status && (
                  <Badge
                    variant={
                      isGraded
                        ? "default"
                        : isSubmitted
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {submission.status}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">{prompt}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Graded Feedback */}
              {isGraded && submission.grade !== null && (
                <div className="rounded-lg border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Graded: {submission.grade}%
                    </h3>
                  </div>
                  {submission.feedback && (
                    <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">
                      {submission.feedback}
                    </p>
                  )}
                  {submission.aiSummary && (
                    <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                      <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                        AI Assessment:
                      </p>
                      <p className="text-xs text-green-800 dark:text-green-200 whitespace-pre-wrap">
                        {submission.aiSummary}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Submitted but not graded */}
              {isSubmitted && !isGraded && (
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Submitted and waiting for parent review
                      {submission.aiGrade !== null &&
                        ` (AI suggested: ${submission.aiGrade}%)`}
                    </p>
                  </div>
                </div>
              )}

              {/* Essay Editor */}
              <div>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write your essay here... Use the toolbar above to format your text."
                  disabled={isSubmitted}
                />
              </div>

              {/* Writing Assistant - Only show if not submitted */}
              {!isSubmitted && (
                <div className="mt-4">
                  <EssayWritingAssistant
                    essayContent={content}
                    essayPrompt={prompt}
                    lessonId={lessonId}
                  />
                </div>
              )}

              {/* Action Buttons */}
              {!isSubmitted && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={handleSaveDraft}
                    disabled={isSaving || isSubmitting || !content.trim()}
                    variant="outline"
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
                    disabled={isSaving || isSubmitting || !content.trim()}
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
                <p className="text-sm text-muted-foreground italic">
                  This essay has been submitted and cannot be edited.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type RevisionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  revision: {
    type: "essay" | "shortAnswer";
    lessonId: string;
    lessonPath: string;
    itemId: string;
    attemptId?: string;
    revisionNote: string;
    originalAnswer?: string;
    itemPrompt?: string;
  } | null;
};

export function RevisionModal({ isOpen, onClose, revision }: RevisionModalProps) {
  const router = useRouter();
  const [newAnswer, setNewAnswer] = useState(revision?.originalAnswer || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!revision) return null;

  // For essays, just redirect to the lesson page
  if (revision.type === "essay") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revise Your Essay</DialogTitle>
            <DialogDescription>
              Your parent has requested revisions to your essay
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Revision Note:</strong>
                <p className="mt-2">{revision.revisionNote}</p>
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground">
              Click the button below to go to the lesson and revise your essay using
              the rich text editor.
            </p>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  router.push(revision.lessonPath);
                  onClose();
                }}
              >
                Go to Lesson
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // For short answers, provide inline revision interface
  const handleSubmitRevision = async () => {
    if (!newAnswer.trim()) {
      alert("Please provide your revised answer");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/student/submit-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: revision.attemptId,
          itemId: revision.itemId,
          newAnswer: newAnswer.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit revision");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setNewAnswer("");
      }, 1500);
    } catch (error) {
      console.error("Error submitting revision:", error);
      alert("Failed to submit revision. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revise Your Answer</DialogTitle>
          <DialogDescription>
            Your parent has requested revisions to your short answer
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <p className="text-lg font-medium">Revision submitted successfully!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Revision Note from your parent:</strong>
                <p className="mt-2 whitespace-pre-wrap">{revision.revisionNote}</p>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Question</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{revision.itemPrompt}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Original Answer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                  {revision.originalAnswer}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Revised Answer</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Type your revised answer here..."
                  rows={8}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRevision} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Revision"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

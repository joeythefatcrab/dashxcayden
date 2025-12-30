"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { EssayGrading } from "./EssayGrading";

type Submission = {
  id: string;
  submittedAt: string;
  student: {
    id: string;
    name: string;
  };
};

export function PendingEssaysList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGrading, setShowGrading] = useState(false);

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

  if (showGrading) {
    return <EssayGrading onBack={() => {
      setShowGrading(false);
      loadPendingEssays();
    }} />;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return null; // Don't show card if no pending essays
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <FileText className="h-5 w-5" />
          Pending Essays to Grade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            You have <span className="font-semibold">{submissions.length}</span>{" "}
            {submissions.length === 1 ? "essay" : "essays"} waiting for grading
          </p>
          <Button
            onClick={() => setShowGrading(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Grade Essays
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

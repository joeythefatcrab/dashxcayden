"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { FloatingEssaySubmission } from "./FloatingEssaySubmission";

type Props = {
  studentId: string;
  lessonId: string;
  lessonTitle: string;
  // For lessons without ESSAY items, we'll use a generic prompt
  itemId?: string;
};

export function LessonEssayButton({ studentId, lessonId, lessonTitle, itemId }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Use a generic itemId if none provided (for old curricula)
  const essayItemId = itemId || `generic-essay-${lessonId}`;
  const essayPrompt = `Write an essay about what you learned in: ${lessonTitle}`;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Essay
      </Button>

      <FloatingEssaySubmission
        studentId={studentId}
        lessonId={lessonId}
        itemId={essayItemId}
        prompt={essayPrompt}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

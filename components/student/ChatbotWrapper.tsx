"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AIChatbot } from "./AIChatbot";

export function ChatbotWrapper() {
  const pathname = usePathname();
  const [lessonId, setLessonId] = useState<string | null>(null);

  useEffect(() => {
    // Extract lessonId from URL if on a lesson page
    // Pattern: /my-courses/[curriculumId]/lessons/[lessonId]
    const match = pathname?.match(/\/my-courses\/[^/]+\/lessons\/([^/]+)/);
    if (match) {
      setLessonId(match[1]);
    } else {
      setLessonId(null);
    }
  }, [pathname]);

  return <AIChatbot lessonId={lessonId} />;
}

"use client";

import { useEffect, useState } from "react";
import { FloatingNotes } from "./FloatingNotes";

export function FloatingNotesWrapper() {
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch student ID from session
    fetch("/api/student/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.studentId) {
          setStudentId(data.studentId);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch student ID:", error);
      });
  }, []);

  if (!studentId) {
    return null;
  }

  return <FloatingNotes studentId={studentId} />;
}

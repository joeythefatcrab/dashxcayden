"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface UnenrollButtonProps {
  enrollmentId: string;
  studentName: string;
  courseName: string;
  completedLessons: number;
  totalLessons: number;
}

export function UnenrollButton({
  enrollmentId,
  studentName,
  courseName,
  completedLessons,
  totalLessons,
}: UnenrollButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleUnenroll = async () => {
    let confirmMessage = `Are you sure you want to unenroll ${studentName} from "${courseName}"?\n\nThis will remove all progress data (${completedLessons}/${totalLessons} lessons completed).\n\nThis action CANNOT be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unenroll student");
      }

      alert(data.message || "Student unenrolled successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Error unenrolling student:", error);
      alert(error.message || "Failed to unenroll student");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleUnenroll}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

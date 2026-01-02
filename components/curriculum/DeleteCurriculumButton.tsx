"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface DeleteCurriculumButtonProps {
  curriculumId: string;
  curriculumName: string;
  enrollmentCount: number;
}

export function DeleteCurriculumButton({
  curriculumId,
  curriculumName,
  enrollmentCount,
}: DeleteCurriculumButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    let confirmMessage = `Are you sure you want to delete "${curriculumName}"?\n\nThis action cannot be undone. All units, lessons, items, and student progress will be permanently deleted.`;

    if (enrollmentCount > 0) {
      confirmMessage = `WARNING: This curriculum is assigned to ${enrollmentCount} student${enrollmentCount > 1 ? 's' : ''}!\n\nDeleting it will remove all student progress and enrollments.\n\nAre you absolutely sure you want to delete "${curriculumName}"?\n\nThis action CANNOT be undone.`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/curricula/${curriculumId}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete curriculum");
      }

      alert(data.message || "Curriculum deleted successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting curriculum:", error);
      alert(error.message || "Failed to delete curriculum");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}

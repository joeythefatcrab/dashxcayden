"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/curricula/${curriculumId}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete curriculum");
      }

      toast.success(data.message || "Curriculum deleted successfully");
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting curriculum:", error);
      toast.error(error.message || "Failed to delete curriculum");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Curriculum</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <strong>{curriculumName}</strong>?
            </p>
            {enrollmentCount > 0 && (
              <p className="text-destructive font-semibold">
                Warning: This curriculum is assigned to {enrollmentCount} student
                {enrollmentCount > 1 ? "s" : ""}. Deleting it will remove all
                student progress and enrollments.
              </p>
            )}
            <p className="text-sm">
              This action cannot be undone. All units, lessons, items, and student
              progress will be permanently deleted.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Curriculum"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

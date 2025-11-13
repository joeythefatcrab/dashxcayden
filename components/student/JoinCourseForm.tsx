"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";

interface JoinCourseFormProps {
  studentId: string;
}

export function JoinCourseForm({ studentId }: JoinCourseFormProps) {
  const router = useRouter();
  const [courseCode, setCourseCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    setError("");
    setSuccess(false);

    try {
      // Format code
      const formattedCode = courseCode.toUpperCase().trim();

      const response = await fetch("/api/student/join-with-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          courseCode: formattedCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join course");
      }

      // Success!
      setSuccess(true);
      setCourseCode("");

      // Redirect to the course after a moment
      setTimeout(() => {
        router.push(`/my-courses/${data.curriculumId}`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error("Join course error:", err);
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="courseCode">Course Code</Label>
        <Input
          id="courseCode"
          type="text"
          placeholder="ABC-123"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
          disabled={isJoining || success}
          required
          className="font-mono text-lg uppercase tracking-wider"
          maxLength={7}
        />
        <p className="text-xs text-muted-foreground">
          Enter the 6-character code (letters and numbers)
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle className="h-4 w-4" />
          Successfully joined! Redirecting to course...
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isJoining || success || !courseCode}
      >
        {isJoining ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Joining...
          </>
        ) : success ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Joined!
          </>
        ) : (
          "Join Course"
        )}
      </Button>
    </form>
  );
}

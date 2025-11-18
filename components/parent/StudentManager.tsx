"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Mail, Calendar, BookOpen, CheckCircle, Clock, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  grade: number | null;
  user: { email: string } | null;
  enrollments: Array<{
    curriculum: {
      id: string;
      name: string;
      subject: string | null;
    };
  }>;
}

interface Invitation {
  id: string;
  studentEmail: string;
  studentName: string | null;
  curriculaIds: string[];
  expiresAt: Date;
  createdAt: Date;
}

interface Curriculum {
  id: string;
  name: string;
  subject: string | null;
  grade: number | null;
  description: string | null;
}

interface StudentManagerProps {
  students: Student[];
  invitations: Invitation[];
  curricula: Curriculum[];
}

export function StudentManager({ students, invitations, curricula }: StudentManagerProps) {
  const router = useRouter();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Invite form state
  const [studentEmail, setStudentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [selectedCurricula, setSelectedCurricula] = useState<string[]>([]);

  const handleInviteStudent = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/parent/invite-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentEmail,
          studentName: studentName || undefined,
          curriculaIds: selectedCurricula,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      setSuccess(`Invitation sent to ${studentEmail}!`);

      // Show invite URL in development
      if (data.invitation.inviteUrl) {
        console.log("Invitation URL:", data.invitation.inviteUrl);
      }

      // Reset form
      setStudentEmail("");
      setStudentName("");
      setSelectedCurricula([]);

      // Refresh the page to show new invitation
      setTimeout(() => {
        setIsInviteDialogOpen(false);
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCurriculum = (curriculumId: string) => {
    setSelectedCurricula((prev) =>
      prev.includes(curriculumId)
        ? prev.filter((id) => id !== curriculumId)
        : [...prev, curriculumId]
    );
  };

  const copyInviteUrl = (token: string) => {
    const url = `${window.location.origin}/accept-invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(token);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Invite Student Button */}
      <div className="flex justify-end">
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <UserPlus className="mr-2 h-5 w-5" />
              Invite Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invite a Student</DialogTitle>
              <DialogDescription>
                Send an invitation email to a student. They'll be able to create their account and
                get automatically enrolled in the courses you select.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Student Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Student Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Auto-Enroll in Courses (optional)</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select courses to automatically enroll the student when they accept the invitation.
                </p>
                {curricula.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No courses available yet. Students can join courses later.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                    {curricula.map((curriculum) => (
                      <div key={curriculum.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`curriculum-${curriculum.id}`}
                          checked={selectedCurricula.includes(curriculum.id)}
                          onCheckedChange={() => toggleCurriculum(curriculum.id)}
                          disabled={isLoading}
                        />
                        <label
                          htmlFor={`curriculum-${curriculum.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          <div>{curriculum.name}</div>
                          {curriculum.subject && (
                            <div className="text-xs text-muted-foreground">
                              {curriculum.subject}
                              {curriculum.grade && ` • Grade ${curriculum.grade}`}
                            </div>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
                  {success}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsInviteDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleInviteStudent} disabled={isLoading || !studentEmail}>
                {isLoading ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              Students who have been invited but haven't accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {invitation.studentName || invitation.studentEmail}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {invitation.studentEmail}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                    {invitation.curriculaIds.length > 0 && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {invitation.curriculaIds.length} course
                          {invitation.curriculaIds.length > 1 ? "s" : ""} assigned
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyInviteUrl(invitation.id)}
                  >
                    {copiedUrl === invitation.id ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Active Students ({students.length})
          </CardTitle>
          <CardDescription>Students who have accepted their invitations</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No students yet. Invite your first student to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition"
                >
                  <div className="flex-1">
                    <div className="font-medium">{student.name}</div>
                    {student.user?.email && (
                      <div className="text-sm text-muted-foreground">{student.user.email}</div>
                    )}
                    {student.grade && (
                      <div className="text-sm text-muted-foreground">Grade {student.grade}</div>
                    )}
                    {student.enrollments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {student.enrollments.map((enrollment) => (
                          <Badge key={enrollment.curriculum.id} variant="secondary" className="text-xs">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {enrollment.curriculum.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

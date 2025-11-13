import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { JoinCourseForm } from "@/components/student/JoinCourseForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function JoinCoursePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // @ts-ignore
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Get student profile
  const student = await db.student.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  if (!student) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">No Student Profile</h2>
          <p className="mt-2 text-muted-foreground">
            Unable to find your student profile. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Join a Course</h1>
        <p className="text-muted-foreground">
          Enter the course code provided by your teacher
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Code</CardTitle>
          <CardDescription>
            Course codes are 6 characters (e.g., ABC-123)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinCourseForm studentId={student.id} />
        </CardContent>
      </Card>

      <div className="mt-8 rounded-lg border bg-muted/50 p-6">
        <h3 className="mb-2 font-semibold">How to join a course</h3>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>1. Get the course code from your teacher or parent</li>
          <li>2. Enter the code in the box above</li>
          <li>3. Click "Join Course"</li>
          <li>4. Start learning!</li>
        </ol>
      </div>
    </div>
  );
}

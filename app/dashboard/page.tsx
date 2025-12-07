import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  const { user } = session!; // Layout already checks auth

  // Redirect superadmins to their console
  if (user.role === "SUPERADMIN") {
    redirect("/superadmin");
  }

  // Redirect parents to parent dashboard
  if (user.role === "PARENT") {
    redirect("/curricula");
  }

  // Redirect admins to admin dashboard
  if (user.role === "ADMIN") {
    redirect("/parents");
  }

  // Only students should reach this point
  return (
    <div className="px-4 py-8">
      <div className="container mx-auto">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold">
            Welcome back, {user.name || "there"}!
          </h2>
          <p className="text-muted-foreground">
            Role: <span className="font-medium">{user.role}</span>
          </p>
        </div>

        <StudentDashboard />
      </div>
    </div>
  );
}

function StudentDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-xl font-semibold">My Lessons</h3>
        <p className="mb-4 text-muted-foreground">
          Access your courses and continue learning.
        </p>
        <a
          href="/my-courses"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to My Courses
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 text-lg font-semibold">Current Progress</h3>
          <p className="text-sm text-muted-foreground">
            Check your courses to see progress.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 text-lg font-semibold">Recent Scores</h3>
          <p className="text-sm text-muted-foreground">
            Complete a lesson to see your results!
          </p>
        </div>
      </div>
    </div>
  );
}

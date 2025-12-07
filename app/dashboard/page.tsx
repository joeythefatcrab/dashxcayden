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

        {user.role === "PARENT" && <ParentDashboard />}
        {user.role === "STUDENT" && <StudentDashboard />}
        {user.role === "ADMIN" && <AdminDashboard />}
      </div>
    </div>
  );
}

function ParentDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-xl font-semibold">Your Students</h3>
        <p className="text-muted-foreground">
          No students added yet. Click "Add Student" to get started.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">
            No activity to display yet.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 text-lg font-semibold">Progress Overview</h3>
          <p className="text-sm text-muted-foreground">
            Add a student and enroll them in a curriculum to see progress.
          </p>
        </div>
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


function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-xl font-semibold">Admin Panel</h3>
        <p className="text-muted-foreground">
          Manage users, curricula, and system settings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 text-lg font-semibold">Users</h3>
          <p className="text-sm text-muted-foreground">
            Manage all users in the system.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 text-lg font-semibold">Curricula</h3>
          <p className="text-sm text-muted-foreground">
            View and manage all curricula.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 text-lg font-semibold">Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure system-wide settings.
          </p>
        </div>
      </div>
    </div>
  );
}

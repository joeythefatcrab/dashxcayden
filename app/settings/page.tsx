import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { EmailPreferencesForm } from "@/components/settings/EmailPreferencesForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { TestEmailButton } from "@/components/settings/TestEmailButton";
import { AdminNotifyToggle } from "@/components/settings/AdminNotifyToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { DashboardNav } from "@/components/auth/dashboard-nav";
import { StudentSubscriptionCard } from "@/components/parent/StudentSubscriptionCard";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      digestFrequency: true,
      notifyEmail: true,
      emailPrefsJson: true,
      notifyOnReportSubmission: true,
      email: true,
      name: true,
      role: true,
      theme: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      password: true,
    },
  });

  if (!user) {
    redirect("/sign-in");
  }

  const isParent = user.role === "PARENT";
  const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";

  // Fetch students for parents (for subscription management)
  let students: any[] = [];
  let hasAnySubscription = false;
  if (isParent) {
    students = await db.student.findMany({
      where: { parentId: session.user.id },
      select: {
        id: true,
        name: true,
        subscriptionActive: true,
        subscriptionEndDate: true,
      },
      orderBy: { name: "asc" },
    });
    hasAnySubscription = !!user.stripeSubscriptionId;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and settings
            </p>
          </div>

          <div className="space-y-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your basic account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="text-sm font-medium">{user.name || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <span className="text-sm font-medium">{user.role}</span>
                </div>
              </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the app looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeToggle currentTheme={user.theme || "light"} />
              </CardContent>
            </Card>

            {/* Change Password - Only for credential-based accounts */}
            {user.password && (
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChangePasswordForm />
                </CardContent>
              </Card>
            )}

            {/* Test Email — all roles */}
            <Card>
              <CardHeader>
                <CardTitle>Test Email</CardTitle>
                <CardDescription>
                  Send a test email to confirm your Resend integration is working.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TestEmailButton defaultEmail={user.email} />
              </CardContent>
            </Card>

            {/* Report submission notifications — admins only */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Report Notifications</CardTitle>
                  <CardDescription>
                    Receive an email with a PDF-ready attachment whenever a parent submits a monthly report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminNotifyToggle initialValue={user.notifyOnReportSubmission} />
                </CardContent>
              </Card>
            )}

            {/* Email Preferences - Only for Parents */}
            {isParent && (
              <Card>
                <CardHeader>
                  <CardTitle>Email Notifications</CardTitle>
                  <CardDescription>
                    Choose how often you want to receive updates about your children's progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmailPreferencesForm
                    initialDigestFrequency={user.digestFrequency}
                    initialNotifyEmail={user.notifyEmail}
                    initialEmailPrefsJson={user.emailPrefsJson}
                  />
                </CardContent>
              </Card>
            )}

            {/* Subscription Management - Only for Parents */}
            {isParent && students.length > 0 && (
              <StudentSubscriptionCard
                students={students.map(s => ({
                  id: s.id,
                  name: s.name,
                  subscriptionActive: s.subscriptionActive || false,
                  subscriptionEndDate: s.subscriptionEndDate?.toISOString() || null,
                }))}
                hasAnySubscription={hasAnySubscription}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

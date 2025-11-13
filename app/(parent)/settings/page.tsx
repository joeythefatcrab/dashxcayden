import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { EmailPreferencesForm } from "@/components/settings/EmailPreferencesForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // @ts-ignore - role exists in our session
  if (session.user.role !== "PARENT") {
    redirect("/dashboard");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      digestFrequency: true,
      notifyEmail: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account preferences and email notifications
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Preferences */}
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
            />
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Name:</span> {user.name || "Not set"}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user.email}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

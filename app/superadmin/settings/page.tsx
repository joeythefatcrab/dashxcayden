import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SignupCodeManager } from "@/components/superadmin/SignupCodeManager";
import { PaywallSettings } from "@/components/superadmin/PaywallSettings";

export default async function SuperadminSettingsPage() {
  const session = await auth();

  // @ts-ignore
  const userRole = session?.user?.realRole || session?.user?.role;
  if (!session?.user || userRole !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  // Get current signup code
  const signupCodeSetting = await db.systemSetting.findUnique({
    where: { key: "signup_code" },
  });

  // Paywall settings
  const paywallSetting = await db.systemSetting.findUnique({
    where: { key: "paywall_enabled" },
  });
  const paywallEnabled = paywallSetting?.value !== "false";

  const students = await db.student.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      paywallExempt: true,
      subscriptionActive: true,
      parent: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Configure platform-wide settings and access controls
        </p>
      </div>

      <SignupCodeManager currentCode={signupCodeSetting?.value || ""} />

      <PaywallSettings paywallEnabled={paywallEnabled} students={students} />
    </div>
  );
}

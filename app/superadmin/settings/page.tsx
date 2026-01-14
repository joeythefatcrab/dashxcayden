import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SignupCodeManager } from "@/components/superadmin/SignupCodeManager";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Configure platform-wide settings and access controls
        </p>
      </div>

      <SignupCodeManager currentCode={signupCodeSetting?.value || ""} />
    </div>
  );
}

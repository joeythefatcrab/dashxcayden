import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // For now, redirect new users to dashboard
  // Later we'll add a proper onboarding flow for creating students
  redirect("/dashboard");
}

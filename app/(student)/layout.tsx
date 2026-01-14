import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/auth/dashboard-nav";
import { ChatbotWrapper } from "@/components/student/ChatbotWrapper";
import { FloatingNotesWrapper } from "@/components/student/FloatingNotesWrapper";
import { DailyTimeLogWrapper } from "@/components/student/DailyTimeLogWrapper";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // @ts-ignore - role exists in session
  if (!["STUDENT", "SUPERADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <main className="flex-1 bg-muted/30">{children}</main>
      <ChatbotWrapper />
      <FloatingNotesWrapper />
      <DailyTimeLogWrapper />
    </div>
  );
}

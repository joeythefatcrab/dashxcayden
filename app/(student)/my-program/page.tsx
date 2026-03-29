import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProgramDashboard } from "@/components/student/ProgramDashboard";

export default async function MyProgramPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return <ProgramDashboard />;
}

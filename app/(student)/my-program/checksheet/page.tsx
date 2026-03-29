import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProgramChecksheet } from "@/components/student/ProgramChecksheet";

export default async function ChecksheetPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; programId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const { studentId, programId } = await searchParams;
  return <ProgramChecksheet studentId={studentId} programId={programId} />;
}

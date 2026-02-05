import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CourseEditor } from "@/components/curriculum/CourseEditor";

export default async function EditCurriculumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const curriculum = await db.curriculum.findUnique({
    where: { id },
    include: {
      units: {
        include: {
          lessons: {
            include: {
              items: {
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!curriculum) {
    notFound();
  }

  return (
    <div className="px-4 py-8">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6">
          <Link href={`/curricula/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit: {curriculum.name}</h1>
          <p className="text-muted-foreground mt-1">
            Add, remove, or reorder units, lessons, and items. Changes are saved as you go.
          </p>
        </div>

        <CourseEditor curriculum={curriculum} />
      </div>
    </div>
  );
}

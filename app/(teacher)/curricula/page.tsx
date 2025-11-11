import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, BookOpen, FileText } from "lucide-react";
import Link from "next/link";

export default async function CurriculaPage() {
  const session = await auth();

  if (!session?.user || !["TEACHER", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const curricula = await db.curriculum.findMany({
    where: {
      createdById: session.user.id,
    },
    include: {
      units: {
        include: {
          lessons: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="px-4 py-8">
      <div className="container mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Curricula</h1>
            <p className="text-muted-foreground">
              Upload and manage your curriculum files
            </p>
          </div>
          <Link href="/curricula/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Upload Curriculum
            </Button>
          </Link>
        </div>

        {curricula.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No curricula yet</h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Upload a PDF, DOCX, or CSV file to get started
              </p>
              <Link href="/curricula/new">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Upload Your First Curriculum
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {curricula.map((curriculum) => {
              const lessonCount = curriculum.units.reduce(
                (acc, unit) => acc + unit.lessons.length,
                0
              );

              return (
                <Link
                  key={curriculum.id}
                  href={`/curricula/${curriculum.id}`}
                >
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="line-clamp-2">{curriculum.name}</span>
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </CardTitle>
                      {curriculum.description && (
                        <CardDescription className="line-clamp-2">
                          {curriculum.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">
                            {curriculum.units.length}
                          </span>{" "}
                          units
                        </div>
                        <div>
                          <span className="font-medium">{lessonCount}</span>{" "}
                          lessons
                        </div>
                      </div>
                      {curriculum.subject && (
                        <div className="mt-2">
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {curriculum.subject}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

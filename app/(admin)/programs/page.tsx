import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BookOpen, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateProgramForm } from "@/components/admin/CreateProgramForm";

export default async function ProgramsPage() {
  const session = await auth();
  // @ts-ignore
  const userRole: string = session?.user?.realRole || session?.user?.role || "";
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(userRole)) redirect("/dashboard");

  const programs = await db.program.findMany({
    include: { _count: { select: { programCourses: true, enrollments: true } } },
    orderBy: [{ academicYear: "desc" }, { name: "asc" }],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yearly Programs</h1>
          <p className="mt-2 text-muted-foreground">
            Bundle courses into a full academic-year curriculum for students
          </p>
        </div>
        <CreateProgramForm />
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No programs yet. Create your first yearly program above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((p) => (
            <Link key={p.id} href={`/programs/${p.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <Badge variant={p.isActive ? "default" : "secondary"}>
                      {p.academicYear}
                    </Badge>
                  </div>
                  {p.description && (
                    <CardDescription className="line-clamp-2">{p.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {p._count.programCourses} courses
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {p._count.enrollments} students
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

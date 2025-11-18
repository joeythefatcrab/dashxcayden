import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";

export default async function GlossaryPage() {
  const session = await auth();

  if (!session?.user || !["PARENT", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const glossaryTerms = await db.glossaryTerm.findMany({
    orderBy: { term: "asc" },
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Glossary</h1>
          <p className="text-muted-foreground">
            Manage terms that appear with hover definitions in lessons
          </p>
        </div>
        <Link href="/glossary/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Term
          </Button>
        </Link>
      </div>

      {glossaryTerms.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Glossary Terms</CardTitle>
            <CardDescription>
              Add your first glossary term to enable hover definitions in lessons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              To use glossary terms in lessons, wrap them in double brackets:
              <code className="mx-1 rounded bg-accent px-1">[[photosynthesis]]</code>
            </p>
            <Link href="/glossary/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add First Term
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Usage Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                In lesson content, wrap terms with double brackets to show hover definitions:{" "}
                <code className="rounded bg-accent px-1">[[term]]</code>
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {glossaryTerms.map((term) => (
              <Card key={term.id} className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {term.term}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
                    {term.definition}
                  </p>

                  {term.derivation && (
                    <div className="mb-3 rounded-md bg-accent p-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Etymology: </span>
                        {term.derivation}
                      </p>
                    </div>
                  )}

                  {term.mediaUrl && (
                    <div className="mb-3">
                      {term.mediaType === "image" ? (
                        <img
                          src={term.mediaUrl}
                          alt={term.term}
                          className="h-24 w-full rounded-md border object-cover"
                        />
                      ) : (
                        <div className="flex h-24 items-center justify-center rounded-md border bg-accent">
                          <span className="text-xs text-muted-foreground">Video attached</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/glossary/${term.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

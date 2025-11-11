import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, Mail, FileSpreadsheet, CheckCircle2, Calendar } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center gap-8 px-4 py-20 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          Adaptive Homeschool
          <br />
          <span className="text-primary">Curriculum Platform</span>
        </h1>
        <p className="max-w-2xl text-xl text-muted-foreground">
          Upload your curriculum, let students learn at their own pace with intelligent gating,
          and get automated progress reports for compliance and tracking.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/sign-in">
            <Button size="lg" className="text-lg">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="lg" variant="outline" className="text-lg">
              Sign Up
            </Button>
          </Link>
          <a
            href="https://calendly.com/cc283-rice/30min?month=2025-11"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="secondary" className="text-lg">
              <Calendar className="mr-2 h-5 w-5" />
              Schedule a Demo
            </Button>
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 px-4 py-16">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Everything You Need for Homeschool Success
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="flex flex-col items-start gap-4 pt-6">
                <div className="rounded-lg bg-primary/10 p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Curriculum Upload</h3>
                <p className="text-muted-foreground">
                  Upload PDF, DOCX, or CSV curricula and automatically parse them into structured lessons, units, and assessments.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-start gap-4 pt-6">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Adaptive Pacing</h3>
                <p className="text-muted-foreground">
                  Lessons unlock only when previous material is mastered. Students progress at their own pace with intelligent gating.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-start gap-4 pt-6">
                <div className="rounded-lg bg-primary/10 p-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Auto-Grading</h3>
                <p className="text-muted-foreground">
                  Multiple choice and short answer questions are automatically graded with instant feedback for students.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-start gap-4 pt-6">
                <div className="rounded-lg bg-primary/10 p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Hover Glossary</h3>
                <p className="text-muted-foreground">
                  Students can hover over terms to see definitions, derivations, and optional images or videos without leaving the lesson.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-start gap-4 pt-6">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Parent Digests</h3>
                <p className="text-muted-foreground">
                  Daily and weekly email summaries keep parents informed of student progress, scores, and any blocked lessons.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-start gap-4 pt-6">
                <div className="rounded-lg bg-primary/10 p-3">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Provider Reporting</h3>
                <p className="text-muted-foreground">
                  Export CSV reports showing progress, attendance, and mastery for compliance with homeschool providers and state requirements.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t px-4 py-16 text-center">
        <div className="container mx-auto">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-xl text-muted-foreground">
            Join homeschool families using adaptive curriculum technology
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="text-lg">
                Create Free Account
              </Button>
            </Link>
            <a
              href="https://calendly.com/cc283-rice/30min?month=2025-11"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="text-lg">
                <Calendar className="mr-2 h-5 w-5" />
                Schedule a Demo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Homeschool SaaS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

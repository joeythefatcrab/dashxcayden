import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, FileText, Users } from "lucide-react";
import Link from "next/link";
import { PendingGradesList } from "@/components/grading/pending-grades-list";
import { PendingEssaysList } from "@/components/parent/PendingEssaysList";
import { StudentSubscriptionCard } from "@/components/parent/StudentSubscriptionCard";

type Student = {
  id: string;
  name: string;
  grade: number | null;
  subscriptionActive?: boolean;
  subscriptionEndDate?: string | null;
  user?: {
    email: string;
  } | null;
  enrollments: {
    id: string;
    curriculum: {
      id: string;
      name: string;
      subject: string | null;
    };
  }[];
};

type Props = {
  parentName: string;
  students: Student[];
  hasAnySubscription: boolean;
};

export function ParentDashboard({ parentName, students, hasAnySubscription }: Props) {
  const totalEnrollments = students.reduce((sum, student) => sum + student.enrollments.length, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg border bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {parentName}!
        </h2>
        <p className="text-muted-foreground">
          Here's an overview of your students' progress and items that need your attention.
        </p>
      </div>

      {/* Subscription Status */}
      {students.length > 0 && (
        <StudentSubscriptionCard
          students={students.map(s => ({
            id: s.id,
            name: s.name,
            subscriptionActive: s.subscriptionActive || false,
            subscriptionEndDate: s.subscriptionEndDate || null,
          }))}
          hasAnySubscription={hasAnySubscription}
        />
      )}

      {/* Pending Items Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Items Needing Your Attention</h3>

        <PendingGradesList />
        <PendingEssaysList />
      </div>

      {/* Students Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Students</h3>
          <Link href="/students">
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Manage Students
            </Button>
          </Link>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No students yet</h3>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Create student accounts to get started
              </p>
              <Link href="/students">
                <Button>
                  <Users className="mr-2 h-4 w-4" />
                  Add Students
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <Card key={student.id}>
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="line-clamp-1">{student.name}</span>
                    {student.grade !== null && (
                      <Badge variant="secondary" className="ml-2">
                        Grade {student.grade}
                      </Badge>
                    )}
                  </CardTitle>
                  {student.user?.email && (
                    <CardDescription className="text-xs truncate">
                      {student.user.email}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Enrollment Stats */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {student.enrollments.length} active{" "}
                      {student.enrollments.length === 1 ? "course" : "courses"}
                    </span>
                  </div>

                  {/* Enrolled Courses */}
                  {student.enrollments.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Enrolled Courses:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {student.enrollments.slice(0, 3).map((enrollment) => (
                          <Badge
                            key={enrollment.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {enrollment.curriculum.subject || enrollment.curriculum.name}
                          </Badge>
                        ))}
                        {student.enrollments.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{student.enrollments.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* View Details Button */}
                  <Link href={`/students/${student.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/curricula">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-semibold">Curricula</h4>
                  <p className="text-xs text-muted-foreground">
                    Manage courses
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/monthly-reports">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-semibold">Monthly Reports</h4>
                  <p className="text-xs text-muted-foreground">
                    View progress
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">
                  {students.length === 1 ? "Student" : "Students"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEnrollments}</p>
                <p className="text-sm text-muted-foreground">
                  Active Enrollments
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

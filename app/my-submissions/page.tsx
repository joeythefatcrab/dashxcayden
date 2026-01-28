import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SubmissionsClient } from "@/components/student/SubmissionsClient";

export default async function MySubmissionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const studentId = session.user.id;

  // Fetch all essay submissions
  const essaySubmissions = await db.essaySubmission.findMany({
    where: {
      studentId,
    },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          unit: {
            select: {
              title: true,
              curriculum: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  // Fetch all attempts with short answer items
  const attempts = await db.attempt.findMany({
    where: {
      studentId,
    },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          unit: {
            select: {
              title: true,
              curriculum: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Filter attempts that have items needing grading or revision requested
  const relevantAttempts = attempts.filter((attempt) => {
    const detail = attempt.detail as any;
    return Object.values(detail).some(
      (item: any) => item.needsGrading || item.revisionRequested
    );
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Submissions</h1>
        <p className="text-muted-foreground">
          View all your submitted work, check grading status, and complete revisions
        </p>
      </div>

      <SubmissionsClient
        essaySubmissions={essaySubmissions.map((sub) => ({
          id: sub.id,
          type: "essay" as const,
          itemId: sub.itemId,
          lessonId: sub.lessonId,
          lessonTitle: sub.lesson.title,
          unitTitle: sub.lesson.unit.title,
          curriculumName: sub.lesson.unit.curriculum.name,
          status: sub.status,
          submittedAt: sub.submittedAt?.toISOString() || null,
          grade: sub.grade,
          feedback: sub.feedback,
          gradedAt: sub.gradedAt?.toISOString() || null,
          revisionNote: sub.revisionNote,
          revisionRequestedAt: sub.revisionRequestedAt?.toISOString() || null,
        }))}
        shortAnswerAttempts={relevantAttempts.map((attempt) => {
          const detail = attempt.detail as any;
          const items = Object.entries(detail)
            .filter(
              ([_, item]: [string, any]) =>
                item.needsGrading || item.revisionRequested
            )
            .map(([itemId, item]: [string, any]) => ({
              itemId,
              itemPrompt: item.itemPrompt || "Short Answer Question",
              answer: item.answer,
              needsGrading: item.needsGrading || false,
              revisionRequested: item.revisionRequested || false,
              revisionNote: item.revisionNote || null,
              revisionRequestedAt: item.revisionRequestedAt || null,
              points: item.points,
              maxPoints: item.maxPoints,
              feedback: item.feedback || null,
            }));

          return {
            attemptId: attempt.id,
            lessonId: attempt.lessonId,
            lessonTitle: attempt.lesson.title,
            unitTitle: attempt.lesson.unit.title,
            curriculumName: attempt.lesson.unit.curriculum.name,
            submittedAt: attempt.createdAt.toISOString(),
            items,
          };
        })}
      />
    </div>
  );
}

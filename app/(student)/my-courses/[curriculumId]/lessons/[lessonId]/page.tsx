import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { LessonPlayer } from "@/components/lesson-player";
import { SubscriptionGate } from "@/components/subscription/SubscriptionGate";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ curriculumId: string; lessonId: string }>;
}) {
  const { curriculumId, lessonId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Get student profile
  const orConditions: Array<{ userId?: string; parent?: { email: string } }> = [
    { userId: session.user.id },
  ];
  if (session.user.email) {
    orConditions.push({ parent: { email: session.user.email } });
  }

  const student = await db.student.findFirst({
    where: {
      OR: orConditions,
    },
  });

  if (!student) {
    redirect("/dashboard");
  }

  // Check paywall: enabled globally AND student has no active sub AND not exempt
  const paywallSetting = await db.systemSetting.findUnique({
    where: { key: "paywall_enabled" },
  });
  const paywallEnabled = paywallSetting?.value !== "false"; // default on
  const showGate =
    paywallEnabled && !student.subscriptionActive && !student.paywallExempt;

  // Get enrollment with progress
  const enrollment = await db.enrollment.findUnique({
    where: {
      studentId_curriculumId: {
        studentId: student.id,
        curriculumId,
      },
    },
  });

  if (!enrollment) {
    redirect("/my-courses");
  }

  // Get lesson with unit and items
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      items: {
        orderBy: { order: "asc" },
      },
      unit: {
        include: {
          curriculum: true,
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!lesson || lesson.unit.curriculum.id !== curriculumId) {
    notFound();
  }

  // Get progress for display purposes
  const progress = enrollment.progress as any;
  const lessonProgress = progress[lessonId];

  // All lessons are unlocked - students self-regulate
  const isLocked = false;

  // Get previous attempts
  const attempts = await db.attempt.findMany({
    where: {
      studentId: student.id,
      lessonId: lesson.id,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const bestAttempt = attempts.length > 0
    ? attempts.reduce((best, current) =>
        current.score > best.score ? current : best
      )
    : null;

  return (
    <>
      {showGate && <SubscriptionGate studentName={student.name} />}
      <LessonPlayer
        lesson={lesson}
        studentId={student.id}
        curriculumId={curriculumId}
        isLocked={isLocked}
        previousLesson={null}
        attempts={attempts}
        bestScore={bestAttempt?.score}
        bestAttempt={bestAttempt}
      />
    </>
  );
}

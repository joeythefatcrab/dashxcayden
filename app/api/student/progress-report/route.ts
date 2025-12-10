import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Allow PARENT and ADMIN roles
  if (!["PARENT", "ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    // Get student with enrollment and attempt data
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: { email: true },
        },
        enrollments: {
          include: {
            curriculum: {
              select: {
                id: true,
                name: true,
                subject: true,
                units: {
                  include: {
                    lessons: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        attempts: {
          orderBy: { createdAt: "desc" },
          take: 20, // Recent attempts
          include: {
            lesson: {
              select: {
                title: true,
                unit: {
                  select: {
                    curriculumId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify access (parent can only see their own students, admin can see all)
    if (session.user.role === "PARENT" && student.parentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Compile student progress data
    const progressData = {
      studentName: student.name,
      grade: student.grade,
      enrollments: student.enrollments.map((enrollment) => {
        const progress = enrollment.progress as any;
        const curriculum = enrollment.curriculum;

        // Calculate progress stats
        const totalLessons = curriculum.units.reduce(
          (acc, unit) => acc + unit.lessons.length,
          0
        );
        const completedLessons = Object.values(progress).filter(
          (p: any) => p.completed
        ).length;
        const progressPercent = totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

        return {
          courseName: curriculum.name,
          subject: curriculum.subject,
          progressPercent,
          completedLessons,
          totalLessons,
        };
      }),
      recentAttempts: student.attempts.slice(0, 10).map((attempt) => ({
        lessonTitle: attempt.lesson.title,
        score: attempt.score,
        earnedPoints: attempt.earned,
        maxPoints: attempt.maxScore,
        date: attempt.createdAt.toLocaleDateString(),
      })),
    };

    // Calculate overall stats
    const avgScore = student.attempts.length > 0
      ? Math.round(
          student.attempts.reduce((sum, a) => sum + a.score, 0) / student.attempts.length
        )
      : null;

    // Generate AI progress report using Loopi-style prompt
    const prompt = `You are an AI assistant that creates professional, clear, and concise progress reports for K-12 students. Generate a progress report blurb for this student:

Student Name: ${student.name}
${student.grade ? `Grade: ${student.grade}` : ""}

Enrolled Courses:
${progressData.enrollments.map(e => `- ${e.courseName} (${e.subject || "General"}): ${e.progressPercent}% complete (${e.completedLessons}/${e.totalLessons} lessons)`).join("\n")}

Recent Performance:
${progressData.recentAttempts.length > 0 ? progressData.recentAttempts.map(a => `- ${a.lessonTitle}: ${a.score}% (${a.earnedPoints}/${a.maxPoints} points) on ${a.date}`).join("\n") : "No recent attempts"}

${avgScore !== null ? `Average Score: ${avgScore}%` : ""}

Generate a warm, supportive, parent-friendly progress report (2-3 paragraphs) that:
1. Highlights what the student is currently working on
2. Notes their progress and performance trends
3. Identifies strengths and areas for growth
4. Provides encouragement and next steps
5. Uses clear, jargon-free language

Keep it concise, specific, and actionable.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Loopi Progress Reports, an AI assistant that creates professional, clear, and concise K-12 student progress reports. Write in a warm & supportive tone that is parent-friendly and jargon-free.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const progressReport = completion.choices[0].message.content;

    return NextResponse.json({
      success: true,
      report: progressReport,
      stats: {
        avgScore,
        totalAttempts: student.attempts.length,
        enrolledCourses: student.enrollments.length,
      },
    });
  } catch (error: any) {
    console.error("Error generating progress report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate progress report" },
      { status: 500 }
    );
  }
}

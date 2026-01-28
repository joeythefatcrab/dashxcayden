import { db } from "@/lib/db";

export type ActivityType =
  | "ESSAY_SUBMIT"
  | "ESSAY_GRADE"
  | "ESSAY_REVISION_REQUEST"
  | "SHORT_ANSWER_SUBMIT"
  | "SHORT_ANSWER_GRADE"
  | "SHORT_ANSWER_REVISION_REQUEST"
  | "LESSON_COMPLETE"
  | "LESSON_START"
  | "STUDENT_CREATE"
  | "STUDENT_ENROLL"
  | "REPORT_GENERATE"
  | "TIME_LOG"
  | "EXTERNAL_ACTIVITY_ADD"
  | "LOGIN"
  | "LOGOUT";

type LogActivityParams = {
  userId: string;
  userRole: "STUDENT" | "PARENT" | "ADMIN" | "SUPERADMIN";
  type: ActivityType;
  description: string;
  metadata?: Record<string, any>;
};

export async function logActivity({
  userId,
  userRole,
  type,
  description,
  metadata,
}: LogActivityParams) {
  try {
    await db.userActivity.create({
      data: {
        userId,
        userRole,
        type,
        description,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw - activity logging should not break the main flow
  }
}

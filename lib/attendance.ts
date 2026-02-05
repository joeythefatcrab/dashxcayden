import { db } from "@/lib/db";

/**
 * Mark a student as present for a given date
 * This is called automatically when:
 * - Student logs in
 * - Student or parent logs time/activity
 */
export async function markAttendance(studentId: string, date?: Date) {
  const attendanceDate = date || new Date();
  // Normalize to UTC midnight so all attendance records land on the correct UTC date
  attendanceDate.setUTCHours(0, 0, 0, 0);

  try {
    // Upsert attendance record (create if doesn't exist, do nothing if exists)
    await db.dailyAttendance.upsert({
      where: {
        studentId_date: {
          studentId,
          date: attendanceDate,
        },
      },
      update: {
        // Just update the timestamp if already exists
        updatedAt: new Date(),
      },
      create: {
        studentId,
        date: attendanceDate,
        present: true,
      },
    });

    return true;
  } catch (error) {
    console.error("Error marking attendance:", error);
    return false;
  }
}

/**
 * Get attendance count for a student in a given month
 */
export async function getMonthlyAttendance(
  studentId: string,
  month: number,
  year: number
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const attendance = await db.dailyAttendance.findMany({
    where: {
      studentId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      present: true,
    },
  });

  return attendance.length;
}

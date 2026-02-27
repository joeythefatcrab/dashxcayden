"use client";

import React from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type DailyAttendanceRecord = {
  date: string;
  present: boolean;
};

type CourseStats = {
  curriculumId: string;
  name: string;
  subject: string | null;
  lessonsCompleted: number;
  averageScore: number;
  timeSpentHours: number;
};

type ExternalActivity = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  hoursSpent: number | null;
  category: string | null;
};

type EducatorEvaluation = {
  parentSuccesses?: string;
  studentSuccesses?: string;
  progressRating?: string;
  progressExplanation?: string;
  mostSuccessful?: string;
  programCompletions?: string;
  needsHelp?: string;
};

export type ReportRendererData = {
  report: {
    id: string;
    attendanceData: { present: number; sick: number; vacation: number } | null;
    parentNotes: string | null;
    educatorEvaluation: EducatorEvaluation | null;
    reportContent: string | null;
    externalActivities: ExternalActivity[];
  };
  student: {
    id: string;
    name: string;
    grade: number | null;
    parent: { name: string | null; email: string };
  };
  month: number;
  year: number;
  courseStats: CourseStats[];
  summary: {
    totalAppHours: number;
    totalExternalHours: number;
    totalSchoolHours: number;
  };
  dailyAttendance: DailyAttendanceRecord[];
};

function mapToApsSubject(name: string, subject: string | null): string {
  const s = (name + " " + (subject || "")).toLowerCase();
  if (s.includes("study skill") || s.includes("study tech")) return "Study Skills";
  if (s.includes("vocab")) return "Vocabulary";
  if (s.includes("handwrit")) return "Handwriting";
  if (s.includes("grammar")) return "Grammar";
  if (s.includes("spell")) return "Spelling";
  if (s.includes("creat") && s.includes("writ")) return "Creative Writing";
  if (s.includes("essay") || s.includes("writ") || s.includes("composition")) return "Creative Writing";
  if (s.includes("read")) return "Reading";
  if (s.includes("math") || s.includes("algebra") || s.includes("arithmetic") || s.includes("geometry")) return "Mathematics";
  if (s.includes("geography")) return "Geography";
  if (s.includes("history") || s.includes("civili")) return "American/World History";
  if (s.includes("econ") || s.includes("money") || s.includes("financ") || s.includes("budget")) return "Economics/Money";
  if (s.includes("government") || s.includes("civic") || s.includes("politic")) return "Government/Civics";
  if (s.includes("science") || s.includes("biology") || s.includes("chem") || s.includes("physics") || s.includes("earth")) return "Science";
  if (s.includes("research")) return "Research";
  if (s.includes("music") || s.includes("art") || s.includes("drama") || s.includes("perform") || s.includes("theater")) return "Performing Arts";
  if (s.includes("spanish") || s.includes("french") || s.includes("foreign") || s.includes("language") || s.includes("latin")) return "Foreign Language";
  if (s.includes(" pe ") || s.includes("physical") || s.includes("sport") || s.includes("gym") || s.includes("exercise") || s.includes("fitness")) return "PE";
  if (s.includes("film") || s.includes("documentary") || s.includes("video lesson")) return "Educational Films";
  if (s.includes("seminar")) return "Seminars";
  return "Electives";
}

function mapExternalCategoryToAps(category: string | null): string {
  if (!category) return "Other";
  const c = category.toLowerCase();
  if (c.includes("field trip")) return "Field Trips";
  if (c.includes("pe") || c.includes("sport") || c.includes("physical") || c.includes("exercise") || c.includes("fitness")) return "PE";
  if (c.includes("music") || c.includes("art") || c.includes("perform") || c.includes("theater")) return "Performing Arts";
  if (c.includes("read")) return "Reading";
  if (c.includes("math")) return "Mathematics";
  if (c.includes("science")) return "Science";
  if (c.includes("seminar")) return "Seminars";
  return "Other";
}

function dayMarkColor(mark: string): string {
  if (mark === "P") return "#dcfce7";
  if (mark === "A") return "#fee2e2";
  return "#f9fafb";
}

export function MonthlyReportRenderer({ data }: { data: ReportRendererData }) {
  const { report, student, month, year, courseStats, summary, dailyAttendance } = data;
  const attendance = (report.attendanceData as { present: number; sick: number; vacation: number }) ?? { present: 0, sick: 0, vacation: 0 };
  const totalAttendanceDays = attendance.present + attendance.sick + attendance.vacation;
  const monthName = MONTH_NAMES[month - 1];
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const parentName = student.parent.name || student.parent.email;
  const eval_ = report.educatorEvaluation as EducatorEvaluation | null;

  // Build day → mark map from dailyAttendance
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyMarks: Record<number, string> = {};
  (dailyAttendance ?? []).forEach((r) => {
    const day = new Date(r.date).getUTCDate();
    dailyMarks[day] = r.present ? "P" : "A";
  });

  // Aggregate course hours into APS subject buckets
  const subjectMap: Record<string, { hours: number; items: string[] }> = {};
  courseStats.forEach((c) => {
    if (c.timeSpentHours <= 0) return;
    const aps = mapToApsSubject(c.name, c.subject);
    if (!subjectMap[aps]) subjectMap[aps] = { hours: 0, items: [] };
    subjectMap[aps].hours += c.timeSpentHours;
    subjectMap[aps].items.push(c.name);
  });
  report.externalActivities.forEach((a) => {
    if (!a.hoursSpent) return;
    const aps = mapExternalCategoryToAps(a.category);
    if (!subjectMap[aps]) subjectMap[aps] = { hours: 0, items: [] };
    subjectMap[aps].hours += a.hoursSpent;
    if (!subjectMap[aps].items.includes(a.title)) subjectMap[aps].items.push(a.title);
  });

  const hasSubjects = Object.keys(subjectMap).length > 0;
  const hasDailyMarks = Object.keys(dailyMarks).length > 0;

  return (
    <div
      id="monthly-report-print"
      style={{
        backgroundColor: "#ffffff",
        color: "#111827",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontSize: "13px",
        lineHeight: "1.6",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
      }}
    >
      {/* ── HEADER ── */}
      <div style={{ textAlign: "center", marginBottom: "28px", paddingBottom: "20px", borderBottom: "3px double #111827" }}>
        <div style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "4px" }}>
          Monthly Homeschool Progress Report
        </div>
        <div style={{ fontSize: "16px", letterSpacing: "1px", marginBottom: "16px" }}>
          {monthName} {year}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 32px", fontSize: "13px", maxWidth: "460px", margin: "0 auto", textAlign: "left" }}>
          <div><span style={{ fontWeight: "bold" }}>Student:</span> {student.name}</div>
          <div><span style={{ fontWeight: "bold" }}>Grade:</span> {student.grade ?? "N/A"}</div>
          <div><span style={{ fontWeight: "bold" }}>Parent/Educator:</span> {parentName}</div>
          <div><span style={{ fontWeight: "bold" }}>Report Generated:</span> {today}</div>
        </div>
      </div>

      {/* ── ATTENDANCE ── */}
      <Section title="Monthly Attendance and Progress">
        <div style={{ fontSize: "12px", marginBottom: "10px", color: "#4b5563" }}>
          <strong>P</strong> = Present &nbsp;&nbsp; <strong>A</strong> = Absent &nbsp;&nbsp; <strong>S</strong> = Sick &nbsp;&nbsp; <strong>V</strong> = Vacation
        </div>

        {hasDailyMarks ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "4px",
              marginBottom: "14px",
            }}
          >
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const mark = dailyMarks[day] ?? "";
              return (
                <div
                  key={day}
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: "3px",
                    padding: "5px 3px",
                    textAlign: "center",
                    backgroundColor: dayMarkColor(mark),
                    minWidth: 0,
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#6b7280", marginBottom: "1px" }}>{day}</div>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: mark === "P" ? "#16a34a" : mark === "A" ? "#dc2626" : "#374151" }}>
                    {mark || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "12px" }}>
            No daily marks recorded for this period.
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "24px",
            padding: "10px 14px",
            backgroundColor: "#f9fafb",
            borderRadius: "4px",
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          <span>Present: <strong>{attendance.present}</strong></span>
          <span>Sick: <strong>{attendance.sick}</strong></span>
          <span>Vacation: <strong>{attendance.vacation}</strong></span>
          <span style={{ marginLeft: "auto" }}>Total School Days: <strong>{totalAttendanceDays}</strong></span>
        </div>
      </Section>

      {/* ── SUMMARY ── */}
      <Section title="Summary">
        {report.reportContent ? (
          <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.8" }}>
            {report.reportContent}
          </div>
        ) : (
          <div style={{ color: "#9ca3af", fontStyle: "italic" }}>
            Click "Generate Summary" to create an AI-written narrative for this section.
          </div>
        )}
      </Section>

      {/* ── EDUCATOR EVALUATION ── */}
      <Section title="Educator Evaluation">
        <p style={{ marginBottom: "12px" }}>
          <strong>Name of person filling out form:</strong> {parentName}
        </p>
        {[
          { q: "What successes did you have this month?", a: eval_?.parentSuccesses },
          { q: "What successes did your student have this month?", a: eval_?.studentSuccesses },
          {
            q: `On a scale of 1 to 10, how would you rate your student's overall progress this period?${eval_?.progressRating ? ` (${eval_.progressRating}/10)` : ""}`,
            a: eval_?.progressExplanation,
          },
          { q: "What do you feel was most successful?", a: eval_?.mostSuccessful },
          { q: "Were there any program completions?", a: eval_?.programCompletions },
          { q: "Is there anything that you need help on or would like to communicate?", a: eval_?.needsHelp },
        ].map(({ q, a }) => (
          <div key={q} style={{ marginBottom: "14px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{q}</div>
            <div style={{ paddingLeft: "14px", color: a ? "#111827" : "#9ca3af", fontStyle: a ? "normal" : "italic" }}>
              {a || "Not answered."}
            </div>
          </div>
        ))}
      </Section>

      {/* ── SUBJECT BREAKDOWN ── */}
      <Section title="Subject Breakdown">
        {hasSubjects ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>Courses / Activities</th>
                <th style={{ ...thStyle, textAlign: "right", width: "90px" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(subjectMap)
                .sort((a, b) => b[1].hours - a[1].hours)
                .map(([subject, { hours, items }]) => (
                  <tr key={subject} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={tdStyle}>{subject}</td>
                    <td style={{ ...tdStyle, color: "#4b5563" }}>{items.join(", ")}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: "500" }}>{hours.toFixed(1)} hrs</td>
                  </tr>
                ))}
              <tr style={{ backgroundColor: "#f9fafb", fontWeight: "bold" }}>
                <td style={tdStyle} colSpan={2}>Total Schooling Time</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{summary.totalSchoolHours.toFixed(1)} hrs</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#9ca3af", fontStyle: "italic" }}>No subject activity recorded for this period.</p>
        )}
        <div style={{ marginTop: "10px", fontSize: "11px", color: "#6b7280" }}>
          Online coursework: {summary.totalAppHours} hrs &nbsp;|&nbsp; External activities: {summary.totalExternalHours} hrs &nbsp;|&nbsp; Total: {summary.totalSchoolHours} hrs
        </div>
      </Section>

      {/* ── EXTERNAL ACTIVITIES ── */}
      <Section title="External Activities">
        {report.externalActivities.length === 0 ? (
          <p style={{ color: "#9ca3af", fontStyle: "italic" }}>
            No external enrichment activities were recorded for this period.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {report.externalActivities.map((activity) => {
              const [yr, mo, dy] = activity.date.substring(0, 10).split("-");
              const dateStr = `${MONTH_NAMES[parseInt(mo) - 1]} ${parseInt(dy)}, ${yr}`;
              return (
                <div
                  key={activity.id}
                  style={{ borderLeft: "3px solid #f97316", paddingLeft: "12px" }}
                >
                  <div style={{ fontWeight: "bold" }}>
                    {activity.title}
                    <span style={{ fontWeight: "normal", color: "#4b5563", marginLeft: "8px" }}>— {dateStr}</span>
                  </div>
                  {activity.category && (
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Category: {activity.category}</div>
                  )}
                  {activity.description && (
                    <div style={{ marginTop: "3px" }}>{activity.description}</div>
                  )}
                  {activity.hoursSpent != null && (
                    <div style={{ fontSize: "12px", marginTop: "3px", color: "#4b5563" }}>
                      Time Spent: {activity.hoursSpent} hours
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── ADDITIONAL COMMENTS ── */}
      <Section title="Additional Comments">
        {report.parentNotes ? (
          <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.8" }}>{report.parentNotes}</div>
        ) : (
          <p style={{ color: "#9ca3af", fontStyle: "italic" }}>No additional comments for this period.</p>
        )}
      </Section>

      {/* ── FOOTER ── */}
      <div
        style={{
          marginTop: "28px",
          paddingTop: "12px",
          borderTop: "2px solid #111827",
          textAlign: "center",
          fontSize: "11px",
          color: "#6b7280",
          letterSpacing: "0.5px",
        }}
      >
        End of Report — {monthName} {year} — {student.name}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div
        style={{
          fontSize: "12px",
          fontWeight: "bold",
          letterSpacing: "2px",
          textTransform: "uppercase",
          borderBottom: "1px solid #374151",
          paddingBottom: "5px",
          marginBottom: "12px",
          color: "#374151",
          fontFamily: "'Arial', sans-serif",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  textAlign: "left",
  fontWeight: "bold",
  fontSize: "12px",
  letterSpacing: "0.5px",
};

const tdStyle: React.CSSProperties = {
  padding: "7px 10px",
  border: "1px solid #e5e7eb",
  verticalAlign: "top",
};

"use client";

import React from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Exact APS subject list in official form order
const APS_SUBJECTS = [
  "Study Skills/Study Technology",
  "Reading",
  "Vocabulary",
  "Handwriting",
  "Creative Writing",
  "Grammar",
  "Spelling",
  "Mathematics",
  "Geography",
  "American/World History",
  "Economics/Money",
  "Government/Civics",
  "Science",
  "Research",
  "Performing Arts",
  "Foreign Language",
  "PE",
  "Educational Films",
  "Seminars",
  "Field Trips",
  "Electives",
  "Other",
] as const;

type ApsSubject = (typeof APS_SUBJECTS)[number];

// ─── Types ────────────────────────────────────────────────────────────────────

type DailyAttendanceRecord = {
  date: string;
  present: boolean;
};

type CourseStats = {
  curriculumId: string;
  name: string;
  subject: string | null;
  apsSubject?: string | null;
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

type DayEntry = {
  status: "P" | "A" | "S" | "V" | "NS";
  hours?: number;
  note?: string;
};

export type ReportRendererData = {
  report: {
    id: string;
    attendanceData: { present: number; sick: number; vacation: number; days?: Record<string, DayEntry> } | null;
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

// ─── Subject mapping ──────────────────────────────────────────────────────────

function mapToApsSubject(name: string, subject: string | null): ApsSubject {
  const s = (name + " " + (subject || "")).toLowerCase();
  if (s.includes("study skill") || s.includes("study tech")) return "Study Skills/Study Technology";
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

function mapExternalCategoryToAps(category: string | null): ApsSubject {
  if (!category) return "Other";
  // New entries use exact APS subject names — short-circuit immediately
  if ((APS_SUBJECTS as readonly string[]).includes(category)) return category as ApsSubject;
  // Legacy fallback for old category values stored before the rename
  const c = category.toLowerCase();
  if (c.includes("math")) return "Mathematics";
  if (c.includes("reading")) return "Reading";
  if (c.includes("grammar") || c.includes("language art")) return "Grammar";
  if (c.includes("spelling")) return "Spelling";
  if (c.includes("vocab")) return "Vocabulary";
  if (c.includes("handwrit")) return "Handwriting";
  if (c.includes("writing") || c.includes("creative writ") || c.includes("essay") || c.includes("composition")) return "Creative Writing";
  if (c.includes("science")) return "Science";
  if (c.includes("history")) return "American/World History";
  if (c.includes("geography")) return "Geography";
  if (c.includes("econ") || c.includes("money")) return "Economics/Money";
  if (c.includes("government") || c.includes("civic")) return "Government/Civics";
  if (c.includes("foreign language") || c.includes("spanish") || c.includes("french") || c.includes("latin")) return "Foreign Language";
  if (c.includes("study skill")) return "Study Skills/Study Technology";
  if (c.includes("field trip")) return "Field Trips";
  if (c.includes("pe") || c.includes("sport") || c.includes("physical") || c.includes("exercise") || c.includes("fitness")) return "PE";
  if (c.includes("music") || c.includes("art") || c.includes("perform") || c.includes("theater") || c.includes("drama")) return "Performing Arts";
  if (c.includes("seminar")) return "Seminars";
  if (c.includes("volunteer") || c.includes("community service")) return "Other";
  return "Other";
}

function dayMarkColor(mark: string): string {
  if (mark === "P") return "#dcfce7";
  if (mark === "A") return "#fee2e2";
  if (mark === "S") return "#fef9c3";
  if (mark === "V") return "#dbeafe";
  if (mark === "NS") return "#f3f4f6";
  return "#ffffff";
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MonthlyReportRenderer({ data }: { data: ReportRendererData }) {
  const { report, student, month, year, courseStats, summary, dailyAttendance } = data;
  const attendanceRaw = report.attendanceData as { present: number; sick: number; vacation: number; days?: Record<string, DayEntry> } | null;
  const storedAttendance = attendanceRaw ?? { present: 0, sick: 0, vacation: 0 };
  const monthName = MONTH_NAMES[month - 1];
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const parentName = student.parent.name || student.parent.email;
  const eval_ = report.educatorEvaluation as EducatorEvaluation | null;

  // Build day → mark map (1-based day number):
  //   1. Seed from auto-detected DailyAttendance records (P/A)
  //   2. Override with parent-saved attendanceData.days entries
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyMarks: Record<number, { status: string; hours?: number }> = {};
  (dailyAttendance ?? []).forEach((r) => {
    const day = new Date(r.date).getUTCDate();
    dailyMarks[day] = { status: r.present ? "P" : "A" };
  });
  if (attendanceRaw?.days) {
    for (const [key, entry] of Object.entries(attendanceRaw.days)) {
      const day = parseInt(key.split("-")[2], 10);
      if (day >= 1 && day <= daysInMonth) {
        dailyMarks[day] = { status: entry.status, hours: entry.hours };
      }
    }
  }

  // Derive totals from combined dailyMarks
  let presentCount = 0, sickCount = 0, vacationCount = 0;
  for (const entry of Object.values(dailyMarks)) {
    if (entry.status === "P") presentCount++;
    else if (entry.status === "S") sickCount++;
    else if (entry.status === "V") vacationCount++;
  }
  const hasDailyData = Object.keys(dailyMarks).length > 0;
  const displayPresent  = hasDailyData ? presentCount  : storedAttendance.present;
  const displaySick     = hasDailyData ? sickCount     : storedAttendance.sick;
  const displayVacation = hasDailyData ? vacationCount : storedAttendance.vacation;
  const totalAttendanceDays = displayPresent + displaySick + displayVacation;

  // Aggregate hours into APS subject buckets
  const subjectMap: Record<string, { hours: number; items: string[] }> = {};
  (courseStats ?? []).forEach((c) => {
    if (c.timeSpentHours <= 0) return;
    // Use admin-assigned apsSubject if set; otherwise keyword-match from name/subject
    const aps = (c.apsSubject && (APS_SUBJECTS as readonly string[]).includes(c.apsSubject))
      ? (c.apsSubject as ApsSubject)
      : mapToApsSubject(c.name, c.subject);
    if (!subjectMap[aps]) subjectMap[aps] = { hours: 0, items: [] };
    subjectMap[aps].hours += c.timeSpentHours;
    subjectMap[aps].items.push(c.name);
  });
  (report.externalActivities ?? []).forEach((a) => {
    if (!a.hoursSpent) return;
    let aps: ApsSubject = mapExternalCategoryToAps(a.category);
    if (aps === "Other") {
      const titleAps = mapToApsSubject(a.title, null);
      if (titleAps !== "Electives") aps = titleAps;
    }
    if (!subjectMap[aps]) subjectMap[aps] = { hours: 0, items: [] };
    subjectMap[aps].hours += a.hoursSpent;
    if (!subjectMap[aps].items.includes(a.title)) subjectMap[aps].items.push(a.title);
  });

  return (
    <div
      id="monthly-report-print"
      style={{
        backgroundColor: "#ffffff",
        color: "#111827",
        fontFamily: "'Arial', 'Helvetica', sans-serif",
        fontSize: "12px",
        lineHeight: "1.5",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "32px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
      }}
    >
      {/* ── HEADER ── */}
      <div style={{ textAlign: "center", marginBottom: "20px", paddingBottom: "16px", borderBottom: "2px solid #111827" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
          Monthly Homeschool Progress Report
        </div>
        <div style={{ fontSize: "14px", marginBottom: "12px" }}>{monthName} {year}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px", fontSize: "12px", maxWidth: "440px", margin: "0 auto", textAlign: "left" }}>
          <div><strong>Student:</strong> {student.name}</div>
          <div><strong>Grade:</strong> {student.grade ?? "N/A"}</div>
          <div><strong>Parent/Educator:</strong> {parentName}</div>
          <div><strong>Date Generated:</strong> {today}</div>
        </div>
      </div>

      {/* ── 1. MONTHLY ATTENDANCE ── */}
      <Section title="Monthly Attendance and Progress">
        <div style={{ fontSize: "11px", marginBottom: "8px" }}>
          <strong>Mark:</strong>&nbsp;&nbsp;
          <strong>P</strong> = Present &nbsp;&nbsp;
          <strong>A</strong> = Absent &nbsp;&nbsp;
          <strong>S</strong> = Sick &nbsp;&nbsp;
          <strong>V</strong> = Vacation
        </div>

        {/* Always render 1–31; dim days that fall outside the month */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "10px" }}>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const inMonth = day <= daysInMonth;
            const entry = inMonth ? dailyMarks[day] : undefined;
            const status = entry?.status ?? "";
            return (
              <div
                key={day}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: "2px",
                  padding: "3px 2px",
                  textAlign: "center",
                  backgroundColor: inMonth ? dayMarkColor(status) : "#f9fafb",
                  opacity: inMonth ? 1 : 0.35,
                  minWidth: 0,
                }}
              >
                <div style={{ fontSize: "9px", color: "#6b7280", lineHeight: 1 }}>{day}</div>
                <div style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  lineHeight: 1.4,
                  color: status === "P" ? "#16a34a" : status === "S" ? "#ca8a04" : status === "V" ? "#1d4ed8" : status === "A" ? "#dc2626" : "#9ca3af",
                }}>
                  {inMonth ? (status || "—") : ""}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "20px", fontSize: "12px", fontWeight: "500", padding: "6px 10px", backgroundColor: "#f9fafb", borderRadius: "3px", border: "1px solid #e5e7eb" }}>
          <span>Present: <strong>{displayPresent}</strong></span>
          <span>Sick: <strong>{displaySick}</strong></span>
          <span>Vacation: <strong>{displayVacation}</strong></span>
          <span style={{ marginLeft: "auto" }}>Total Days: <strong>{totalAttendanceDays}</strong></span>
        </div>
      </Section>

      {/* ── 2. EDUCATOR EVALUATION ── */}
      <Section title="Educator Evaluation">
        <EvalRow label="Name of person filling out form:" value={parentName} />
        <EvalRow label="What successes did you have this month?" value={eval_?.parentSuccesses} />
        <EvalRow label="What successes did your student have this month?" value={eval_?.studentSuccesses} />
        <EvalRow
          label={`On a scale of 1 to 10, how would you rate your student's overall progress this period?${eval_?.progressRating ? ` (${eval_.progressRating}/10)` : ""}`}
          value={eval_?.progressExplanation}
        />
        <EvalRow label="What do you feel was most successful?" value={eval_?.mostSuccessful} />
        <EvalRow label="Were there any program completions?" value={eval_?.programCompletions} />
        <EvalRow label="Is there anything that you need help on or would like to communicate?" value={eval_?.needsHelp} />
      </Section>

      {/* ── 3. SUBJECT TABLE ── */}
      <Section title="Subject">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6" }}>
              <th style={{ ...thStyle, width: "32%" }}>Subject</th>
              <th style={thStyle}>Description</th>
              <th style={{ ...thStyle, textAlign: "right", width: "80px" }}>Time</th>
            </tr>
            <tr style={{ backgroundColor: "#f9fafb", fontSize: "10px", color: "#6b7280", fontStyle: "italic" }}>
              <td style={{ ...tdStyle, fontSize: "10px" }}>(Example: Mathematics)</td>
              <td style={{ ...tdStyle, fontSize: "10px" }}>(Saxon lessons 1-10)</td>
              <td style={{ ...tdStyle, fontSize: "10px", textAlign: "right" }}>(20 Hours)</td>
            </tr>
          </thead>
          <tbody>
            {APS_SUBJECTS.map((subject) => {
              const row = subjectMap[subject];
              return (
                <tr key={subject} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdStyle}>{subject}</td>
                  <td style={{ ...tdStyle, color: "#374151" }}>{row ? row.items.join(", ") : ""}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: row ? "600" : "normal" }}>
                    {row ? `${row.hours.toFixed(1)} hrs` : ""}
                  </td>
                </tr>
              );
            })}
            <tr style={{ backgroundColor: "#f3f4f6", fontWeight: "bold", borderTop: "2px solid #374151" }}>
              <td style={tdStyle} colSpan={2}>Total Schooling Time</td>
              <td style={{ ...tdStyle, textAlign: "right" }}>{summary.totalSchoolHours.toFixed(1)} hrs</td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: "6px", fontSize: "10px", color: "#6b7280" }}>
          Online coursework: {summary.totalAppHours} hrs &nbsp;|&nbsp; External activities: {summary.totalExternalHours} hrs
        </div>
      </Section>

      {/* ── 4. ADDITIONAL COMMENTS ── */}
      <Section title="Additional Comments">
        {report.parentNotes ? (
          <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.8" }}>{report.parentNotes}</div>
        ) : (
          <div style={{ minHeight: "60px", borderBottom: "1px solid #d1d5db", marginTop: "8px" }} />
        )}
        <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "6px", fontStyle: "italic" }}>
          Feel free to note any additional comments or questions here.
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <div style={{
        marginTop: "24px", paddingTop: "10px", borderTop: "2px solid #111827",
        textAlign: "center", fontSize: "10px", color: "#6b7280", letterSpacing: "0.5px",
      }}>
        End of Report — {monthName} {year} — {student.name}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{
        fontSize: "11px", fontWeight: "bold", letterSpacing: "1.5px", textTransform: "uppercase",
        borderBottom: "1px solid #374151", paddingBottom: "4px", marginBottom: "10px", color: "#374151",
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function EvalRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ fontWeight: "600", fontSize: "11px", marginBottom: "3px" }}>{label}</div>
      <div style={{
        paddingLeft: "12px",
        color: value ? "#111827" : "#9ca3af",
        fontStyle: value ? "normal" : "italic",
        fontSize: "12px",
        borderBottom: "1px solid #e5e7eb",
        minHeight: "20px",
        paddingBottom: "3px",
      }}>
        {value || ""}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "6px 8px",
  border: "1px solid #d1d5db",
  textAlign: "left",
  fontWeight: "bold",
  fontSize: "11px",
  letterSpacing: "0.3px",
};

const tdStyle: React.CSSProperties = {
  padding: "5px 8px",
  border: "1px solid #e5e7eb",
  verticalAlign: "top",
  fontSize: "12px",
};

"use client";

import React from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// 2026 APS subject list — 7 consolidated categories
const APS_SUBJECTS = [
  "ENGLISH (Reading, Writing, Spelling, Grammar)",
  "MATH/ECONOMICS/BUSINESS",
  "GEOGRAPHY/HISTORY/GOVERNMENT/CIVICS",
  "SCIENCE/RESEARCH",
  "ART/MUSIC/PERFORMANCE",
  "PHYSICAL EDUCATION",
  "ELECTIVES/SEMINARS/FIELD TRIPS/OTHER",
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
  // 2026 fields
  educatorName?: string;
  successes?: string;
  programTargets?: string;
  needsHelp?: string;
  // Legacy fields (pre-2026) — kept for backward-compatible rendering
  parentSuccesses?: string;
  studentSuccesses?: string;
  progressRating?: string;
  progressExplanation?: string;
  mostSuccessful?: string;
  programCompletions?: string;
};

type DayEntry = {
  status: "P" | "A" | "S" | "V" | "NS";
  hours?: number;
  note?: string;
};

export type ReportRendererData = {
  report: {
    id: string;
    attendanceData: { present: number; sick: number; vacation: number; days?: Record<string, DayEntry>; cleared?: string[] } | null;
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
  // English bucket
  if (s.includes("read") || s.includes("vocab") || s.includes("handwrit") || s.includes("grammar") ||
      s.includes("spell") || s.includes("writ") || s.includes("essay") || s.includes("composition") ||
      s.includes("study skill") || s.includes("study tech") || s.includes("language art"))
    return "ENGLISH (Reading, Writing, Spelling, Grammar)";
  // Math/Econ bucket
  if (s.includes("math") || s.includes("algebra") || s.includes("arithmetic") || s.includes("geometry") ||
      s.includes("calculus") || s.includes("econ") || s.includes("money") || s.includes("financ") ||
      s.includes("budget") || s.includes("business") || s.includes("account"))
    return "MATH/ECONOMICS/BUSINESS";
  // Geography/History bucket
  if (s.includes("geography") || s.includes("history") || s.includes("civili") || s.includes("government") ||
      s.includes("civic") || s.includes("politic") || s.includes("social stud"))
    return "GEOGRAPHY/HISTORY/GOVERNMENT/CIVICS";
  // Science bucket
  if (s.includes("science") || s.includes("biology") || s.includes("chem") || s.includes("physics") ||
      s.includes("earth") || s.includes("research") || s.includes("lab"))
    return "SCIENCE/RESEARCH";
  // Art/Music bucket
  if (s.includes("music") || s.includes("art") || s.includes("drama") || s.includes("perform") ||
      s.includes("theater") || s.includes("danc") || s.includes("choral") || s.includes("band") ||
      s.includes("foreign") || s.includes("spanish") || s.includes("french") || s.includes("latin") ||
      s.includes("language"))
    return "ART/MUSIC/PERFORMANCE";
  // PE bucket
  if (s.includes(" pe ") || s.includes("physical") || s.includes("sport") || s.includes("gym") ||
      s.includes("exercise") || s.includes("fitness") || s.includes("athlet"))
    return "PHYSICAL EDUCATION";
  return "ELECTIVES/SEMINARS/FIELD TRIPS/OTHER";
}

function mapExternalCategoryToAps(category: string | null): ApsSubject {
  if (!category) return "ELECTIVES/SEMINARS/FIELD TRIPS/OTHER";
  // New entries already use exact 2026 category names
  if ((APS_SUBJECTS as readonly string[]).includes(category)) return category as ApsSubject;
  // Map old 23-subject values to new 7 buckets
  const c = category.toLowerCase();
  if (c.includes("math") || c.includes("econ") || c.includes("money") || c.includes("business") ||
      c.includes("financ") || c.includes("account"))
    return "MATH/ECONOMICS/BUSINESS";
  if (c.includes("read") || c.includes("grammar") || c.includes("language art") || c.includes("spelling") ||
      c.includes("vocab") || c.includes("handwrit") || c.includes("writing") || c.includes("essay") ||
      c.includes("composition") || c.includes("study skill"))
    return "ENGLISH (Reading, Writing, Spelling, Grammar)";
  if (c.includes("science") || c.includes("research") || c.includes("biology") || c.includes("chem") ||
      c.includes("physics"))
    return "SCIENCE/RESEARCH";
  if (c.includes("history") || c.includes("geography") || c.includes("government") || c.includes("civic"))
    return "GEOGRAPHY/HISTORY/GOVERNMENT/CIVICS";
  if (c.includes("music") || c.includes("art") || c.includes("perform") || c.includes("theater") ||
      c.includes("drama") || c.includes("foreign") || c.includes("spanish") || c.includes("french") ||
      c.includes("latin") || c.includes("danc"))
    return "ART/MUSIC/PERFORMANCE";
  if (c.includes("pe") || c.includes("sport") || c.includes("physical") || c.includes("exercise") ||
      c.includes("fitness") || c.includes("athlet"))
    return "PHYSICAL EDUCATION";
  return "ELECTIVES/SEMINARS/FIELD TRIPS/OTHER";
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
  const attendanceRaw = report.attendanceData as { present: number; sick: number; vacation: number; days?: Record<string, DayEntry>; cleared?: string[] } | null;
  const storedAttendance = attendanceRaw ?? { present: 0, sick: 0, vacation: 0 };
  const monthName = MONTH_NAMES[month - 1];
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const parentName = student.parent.name || student.parent.email;
  const eval_ = report.educatorEvaluation as EducatorEvaluation | null;

  // Build day → mark map (1-based day number):
  //   1. Seed from auto-detected DailyAttendance records (P/A)
  //   2. Remove days explicitly cleared by the parent
  //   3. Override with parent-saved attendanceData.days entries
  const daysInMonth = new Date(year, month, 0).getDate();
  const clearedSet = new Set<string>(attendanceRaw?.cleared ?? []);
  const dailyMarks: Record<number, { status: string; hours?: number }> = {};
  (dailyAttendance ?? []).forEach((r) => {
    const key = typeof r.date === "string" ? r.date.substring(0, 10) : (r.date as Date).toISOString().substring(0, 10);
    if (clearedSet.has(key)) return; // parent explicitly cleared this day
    const day = parseInt(key.split("-")[2], 10);
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
    if (aps === "ELECTIVES/SEMINARS/FIELD TRIPS/OTHER") {
      aps = mapToApsSubject(a.title, null);
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
          Monthly Homeschool Attendance &amp; Progress Report
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
        <EvalRow
          label="Name of person filling out form:"
          value={eval_?.educatorName || parentName}
        />
        <EvalRow
          label="Any educator or student success?"
          value={eval_?.successes ?? eval_?.parentSuccesses ?? eval_?.studentSuccesses}
        />
        <EvalRow
          label="Any program targets completed?"
          value={eval_?.programTargets ?? eval_?.programCompletions}
        />
        <EvalRow
          label="Anything you would like to share or need help with?"
          value={eval_?.needsHelp}
        />
      </Section>

      {/* ── 3. SUBJECT TABLE ── */}
      <Section title="Monthly Study Progress">
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

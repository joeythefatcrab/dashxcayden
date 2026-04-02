import type { ReportRendererData } from "@/components/parent/MonthlyReportRenderer";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const APS_SUBJECTS = [
  "ENGLISH (Reading, Writing, Spelling, Grammar)",
  "MATH/ECONOMICS/BUSINESS",
  "GEOGRAPHY/HISTORY/GOVERNMENT/CIVICS",
  "SCIENCE/RESEARCH",
  "ART/MUSIC/PERFORMANCE",
  "PHYSICAL EDUCATION",
  "ELECTIVES/SEMINARS/FIELD TRIPS/OTHER",
];

function mapToApsSubject(name: string, subject: string | null): string {
  const s = (name + " " + (subject || "")).toLowerCase();
  if (s.includes("read")||s.includes("vocab")||s.includes("handwrit")||s.includes("grammar")||
      s.includes("spell")||s.includes("writ")||s.includes("essay")||s.includes("composition")||
      s.includes("study skill")||s.includes("language art")) return APS_SUBJECTS[0];
  if (s.includes("math")||s.includes("algebra")||s.includes("arithmetic")||s.includes("geometry")||
      s.includes("econ")||s.includes("money")||s.includes("financ")||s.includes("business")) return APS_SUBJECTS[1];
  if (s.includes("geography")||s.includes("history")||s.includes("government")||
      s.includes("civic")||s.includes("politic")) return APS_SUBJECTS[2];
  if (s.includes("science")||s.includes("biology")||s.includes("chem")||s.includes("physics")||
      s.includes("research")) return APS_SUBJECTS[3];
  if (s.includes("music")||s.includes("art")||s.includes("drama")||s.includes("perform")||
      s.includes("theater")||s.includes("spanish")||s.includes("french")||s.includes("language")) return APS_SUBJECTS[4];
  if (s.includes("physical")||s.includes("sport")||s.includes("gym")||s.includes("exercise")) return APS_SUBJECTS[5];
  return APS_SUBJECTS[6];
}

function mapExternalCategoryToAps(category: string | null): string {
  if (!category) return APS_SUBJECTS[6];
  if (APS_SUBJECTS.includes(category)) return category;
  const c = category.toLowerCase();
  if (c.includes("math")||c.includes("econ")||c.includes("money")||c.includes("business")) return APS_SUBJECTS[1];
  if (c.includes("read")||c.includes("grammar")||c.includes("spell")||c.includes("writ")||c.includes("vocab")) return APS_SUBJECTS[0];
  if (c.includes("science")||c.includes("research")) return APS_SUBJECTS[3];
  if (c.includes("history")||c.includes("geography")||c.includes("government")||c.includes("civic")) return APS_SUBJECTS[2];
  if (c.includes("music")||c.includes("art")||c.includes("perform")||c.includes("theater")) return APS_SUBJECTS[4];
  if (c.includes("pe")||c.includes("sport")||c.includes("physical")||c.includes("exercise")) return APS_SUBJECTS[5];
  return APS_SUBJECTS[6];
}

function dayColor(status: string): string {
  if (status === "P") return "#dcfce7";
  if (status === "A") return "#fee2e2";
  if (status === "S") return "#fef9c3";
  if (status === "V") return "#dbeafe";
  return "#f3f4f6";
}

function esc(str: string | null | undefined): string {
  return (str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildReportHtml(data: ReportRendererData): string {
  const { report, student, month, year, courseStats, summary, dailyAttendance, attachments } = data;
  const monthName = MONTH_NAMES[month - 1];
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const parentName = student.parent.name || student.parent.email;
  const eval_ = report.educatorEvaluation as Record<string, string> | null;

  // Build daily marks
  const daysInMonth = new Date(year, month, 0).getDate();
  const attendanceRaw = report.attendanceData as { present?: number; sick?: number; vacation?: number; days?: Record<string, { status: string }>; cleared?: string[] } | null;
  const clearedSet = new Set<string>(attendanceRaw?.cleared ?? []);
  const dailyMarks: Record<number, { status: string }> = {};
  (dailyAttendance ?? []).forEach((r) => {
    const key = typeof r.date === "string" ? r.date.substring(0, 10) : (r.date as Date).toISOString().substring(0, 10);
    if (clearedSet.has(key)) return;
    const day = parseInt(key.split("-")[2], 10);
    dailyMarks[day] = { status: r.present ? "P" : "A" };
  });
  if (attendanceRaw?.days) {
    for (const [key, entry] of Object.entries(attendanceRaw.days)) {
      const day = parseInt(key.split("-")[2], 10);
      if (day >= 1 && day <= daysInMonth) dailyMarks[day] = { status: entry.status };
    }
  }

  let presentCount = 0, sickCount = 0, vacationCount = 0;
  for (const e of Object.values(dailyMarks)) {
    if (e.status === "P") presentCount++;
    else if (e.status === "S") sickCount++;
    else if (e.status === "V") vacationCount++;
  }
  const hasDailyData = Object.keys(dailyMarks).length > 0;
  const displayPresent  = hasDailyData ? presentCount  : (attendanceRaw?.present  ?? 0);
  const displaySick     = hasDailyData ? sickCount     : (attendanceRaw?.sick     ?? 0);
  const displayVacation = hasDailyData ? vacationCount : (attendanceRaw?.vacation ?? 0);

  // Build subject map
  const subjectMap: Record<string, { hours: number; items: string[] }> = {};
  (courseStats ?? []).forEach((c) => {
    if (c.timeSpentHours <= 0) return;
    const aps = (c.apsSubject && APS_SUBJECTS.includes(c.apsSubject)) ? c.apsSubject : mapToApsSubject(c.name, c.subject);
    if (!subjectMap[aps]) subjectMap[aps] = { hours: 0, items: [] };
    subjectMap[aps].hours += c.timeSpentHours;
    subjectMap[aps].items.push(c.name);
  });
  (report.externalActivities ?? []).forEach((a: any) => {
    if (!a.hoursSpent) return;
    let aps = mapExternalCategoryToAps(a.category);
    if (aps === APS_SUBJECTS[6]) aps = mapToApsSubject(a.title, null);
    if (!subjectMap[aps]) subjectMap[aps] = { hours: 0, items: [] };
    subjectMap[aps].hours += a.hoursSpent;
    if (!subjectMap[aps].items.includes(a.title)) subjectMap[aps].items.push(a.title);
  });

  // Calendar grid
  const calendarCells = Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
    const inMonth = day <= daysInMonth;
    const entry = inMonth ? dailyMarks[day] : undefined;
    const status = entry?.status ?? "";
    const textColor = status === "P" ? "#16a34a" : status === "S" ? "#ca8a04" : status === "V" ? "#1d4ed8" : status === "A" ? "#dc2626" : "#9ca3af";
    const bg = inMonth ? dayColor(status) : "#f9fafb";
    return `<div style="border:1px solid #d1d5db;border-radius:2px;padding:3px 2px;text-align:center;background-color:${bg};opacity:${inMonth ? 1 : 0.35};">
      <div style="font-size:9px;color:#6b7280;line-height:1">${day}</div>
      <div style="font-size:11px;font-weight:bold;color:${textColor};line-height:1.4">${inMonth ? (status || "—") : ""}</div>
    </div>`;
  }).join("");

  // Eval rows (new 2026 format with legacy fallback)
  const educatorName = esc(eval_?.educatorName || parentName);
  const successes = esc(eval_?.successes ?? eval_?.parentSuccesses ?? eval_?.studentSuccesses ?? "");
  const programTargets = esc(eval_?.programTargets ?? eval_?.programCompletions ?? "");
  const needsHelp = esc(eval_?.needsHelp ?? "");

  function evalRow(label: string, value: string) {
    return `<div style="margin-bottom:10px">
      <div style="font-weight:600;font-size:11px;margin-bottom:3px">${esc(label)}</div>
      <div style="padding-left:12px;color:${value ? "#111827" : "#9ca3af"};font-style:${value ? "normal" : "italic"};font-size:12px;border-bottom:1px solid #e5e7eb;min-height:20px;padding-bottom:3px">${value || ""}</div>
    </div>`;
  }

  // Subject table rows
  const subjectRows = APS_SUBJECTS.map((subj) => {
    const row = subjectMap[subj];
    return `<tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:12px;vertical-align:top">${esc(subj)}</td>
      <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:12px;vertical-align:top;color:#374151">${row ? esc(row.items.join(", ")) : ""}</td>
      <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:12px;vertical-align:top;text-align:right;font-weight:${row ? "600" : "normal"}">${row ? `${row.hours.toFixed(1)} hrs` : ""}</td>
    </tr>`;
  }).join("");

  function section(title: string, body: string) {
    return `<div style="margin-bottom:20px">
      ${title ? `<div style="font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;border-bottom:1px solid #374151;padding-bottom:4px;margin-bottom:10px;color:#374151">${esc(title)}</div>` : ""}
      ${body}
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${esc(student.name)} — ${esc(monthName)} ${year} Monthly Report</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; font-size:12px; line-height:1.5; color:#111827; background:#fff; margin:0; padding:32px; }
    @media print { body { margin:0; padding:0; } @page { margin:0.75in; } }
  </style>
</head>
<body>
<div style="max-width:800px;margin:0 auto;padding:32px;border:1px solid #d1d5db;border-radius:6px;">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #111827">
    <div style="font-size:18px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">
      Monthly Homeschool Attendance &amp; Progress Report
    </div>
    <div style="font-size:14px;margin-bottom:12px">${esc(monthName)} ${year}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;font-size:12px;max-width:440px;margin:0 auto;text-align:left">
      <div><strong>Student:</strong> ${esc(student.name)}</div>
      <div><strong>Grade:</strong> ${student.grade ?? "N/A"}</div>
      <div><strong>Parent/Educator:</strong> ${esc(parentName)}</div>
      <div><strong>Date Generated:</strong> ${esc(today)}</div>
    </div>
  </div>

  ${section("Monthly Attendance and Progress", `
    <div style="font-size:11px;margin-bottom:8px">
      <strong>P</strong> = Present &nbsp;&nbsp;
      <strong>A</strong> = Absent &nbsp;&nbsp;
      <strong>S</strong> = Sick &nbsp;&nbsp;
      <strong>V</strong> = Vacation
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:10px">
      ${calendarCells}
    </div>
    <div style="display:flex;gap:20px;font-size:12px;font-weight:500;padding:6px 10px;background:#f9fafb;border-radius:3px;border:1px solid #e5e7eb">
      <span>Present: <strong>${displayPresent}</strong></span>
      <span>Sick: <strong>${displaySick}</strong></span>
      <span>Vacation: <strong>${displayVacation}</strong></span>
      <span style="margin-left:auto">Total Days: <strong>${displayPresent + displaySick + displayVacation}</strong></span>
    </div>
  `)}

  ${section("", `
    ${evalRow("Name of person filling out form:", educatorName)}
    ${evalRow("Any educator or student success?", successes)}
    ${evalRow("Any program targets completed?", programTargets)}
    ${evalRow("Anything you would like to share or need help with?", needsHelp)}
  `)}

  ${section("Monthly Study Progress", `
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:6px 8px;border:1px solid #d1d5db;text-align:left;font-weight:bold;font-size:11px;width:38%">Subject</th>
          <th style="padding:6px 8px;border:1px solid #d1d5db;text-align:left;font-weight:bold;font-size:11px">Description</th>
          <th style="padding:6px 8px;border:1px solid #d1d5db;text-align:right;font-weight:bold;font-size:11px;width:80px">Time</th>
        </tr>
      </thead>
      <tbody>
        ${subjectRows}
        <tr style="background:#f3f4f6;font-weight:bold;border-top:2px solid #374151">
          <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:12px" colspan="2">Total Schooling Time</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb;font-size:12px;text-align:right">${summary.totalSchoolHours.toFixed(1)} hrs</td>
        </tr>
      </tbody>
    </table>
    <div style="margin-top:6px;font-size:10px;color:#6b7280">
      Online coursework: ${summary.totalAppHours} hrs &nbsp;|&nbsp; External activities: ${summary.totalExternalHours} hrs
    </div>
  `)}

  ${section("Anything you would like to share or need help with?", report.parentNotes
    ? `<div style="white-space:pre-wrap;line-height:1.8">${esc(report.parentNotes)}</div>`
    : `<div style="min-height:60px;border-bottom:1px solid #d1d5db;margin-top:8px"></div><div style="font-size:10px;color:#6b7280;margin-top:6px;font-style:italic">Feel free to note any additional comments or questions here.</div>`
  )}

  ${attachments && attachments.length > 0 ? section("Attachments", attachments.map(a =>
    `<div style="font-size:12px;margin-bottom:4px"><a href="${esc(a.url)}" style="color:#2563eb">${esc(a.name)}</a></div>`
  ).join("")) : ""}

  <!-- Footer -->
  <div style="margin-top:24px;padding-top:10px;border-top:2px solid #111827;text-align:center;font-size:10px;color:#6b7280;letter-spacing:0.5px">
    End of Report — ${esc(monthName)} ${year} — ${esc(student.name)}
  </div>
</div>
</body>
</html>`;
}

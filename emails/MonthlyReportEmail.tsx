import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Link, Row, Column,
} from "@react-email/components";
import * as React from "react";

interface ExternalActivity {
  title: string;
  category: string;
  hoursSpent?: number;
  description?: string;
}

interface AttendanceData {
  present?: number;
  sick?: number;
  vacation?: number;
  days?: number;
}

interface MonthlyReportEmailProps {
  studentName: string;
  parentName: string;
  month: string;
  year: number;
  grade: string;
  attendanceData: AttendanceData | null;
  parentNotes: string;
  educatorEvaluation: Record<string, string> | null;
  externalActivities: ExternalActivity[];
  reportUrl: string;
}

const EVAL_LABELS: Record<string, string> = {
  parentSuccesses: "Educator successes this month",
  studentSuccesses: "Student successes this month",
  progressRating: "Overall progress rating (1–10)",
  progressExplanation: "If not 10, explanation",
  mostSuccessful: "What was most successful",
  programCompletions: "Program completions",
  needsHelp: "Needs help / communications",
};

export const MonthlyReportEmail = ({
  studentName,
  parentName,
  month,
  year,
  grade,
  attendanceData,
  parentNotes,
  educatorEvaluation,
  externalActivities,
  reportUrl,
}: MonthlyReportEmailProps) => {
  const present = attendanceData?.present ?? 0;
  const sick = attendanceData?.sick ?? 0;
  const vacation = attendanceData?.vacation ?? 0;
  const total = present + sick + vacation;

  return (
    <Html>
      <Head />
      <Preview>Monthly report submitted — {studentName} ({month} {year})</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>HomeschoolHub</Heading>
            <Text style={headerSub}>Monthly Homeschool Attendance &amp; Progress Report</Text>
          </Section>

          <Text style={noticeText}>
            <strong>{parentName}</strong> has submitted the monthly report for{" "}
            <strong>{studentName}</strong> ({month} {year}).
          </Text>

          {/* Student Info */}
          <Section style={infoBox}>
            <Row>
              <Column style={infoCell}><Text style={infoLabel}>Student</Text><Text style={infoValue}>{studentName}</Text></Column>
              <Column style={infoCell}><Text style={infoLabel}>Grade</Text><Text style={infoValue}>{grade || "—"}</Text></Column>
              <Column style={infoCell}><Text style={infoLabel}>Period</Text><Text style={infoValue}>{month} {year}</Text></Column>
            </Row>
          </Section>

          {/* Attendance */}
          <Heading style={h2}>Attendance Summary</Heading>
          <Section style={infoBox}>
            <Row>
              <Column style={infoCell}><Text style={infoLabel}>Present</Text><Text style={{ ...infoValue, color: "#16a34a" }}>{present}</Text></Column>
              <Column style={infoCell}><Text style={infoLabel}>Sick</Text><Text style={{ ...infoValue, color: "#ca8a04" }}>{sick}</Text></Column>
              <Column style={infoCell}><Text style={infoLabel}>Vacation</Text><Text style={{ ...infoValue, color: "#2563eb" }}>{vacation}</Text></Column>
              <Column style={infoCell}><Text style={infoLabel}>Total Days</Text><Text style={infoValue}>{total}</Text></Column>
            </Row>
          </Section>

          {/* Educator Evaluation */}
          {educatorEvaluation && Object.keys(educatorEvaluation).some((k) => educatorEvaluation[k]) && (
            <>
              <Heading style={h2}>Educator Evaluation</Heading>
              {Object.entries(EVAL_LABELS).map(([key, label]) =>
                educatorEvaluation[key] ? (
                  <div key={key} style={evalRow}>
                    <Text style={evalLabel}>{label}</Text>
                    <Text style={evalAnswer}>{educatorEvaluation[key]}</Text>
                  </div>
                ) : null
              )}
            </>
          )}

          {/* External Activities */}
          {externalActivities.length > 0 && (
            <>
              <Heading style={h2}>External Activities ({externalActivities.length})</Heading>
              {externalActivities.map((a, i) => (
                <div key={i} style={activityRow}>
                  <Row>
                    <Column><Text style={actTitle}>{a.title}</Text></Column>
                    {a.hoursSpent != null && (
                      <Column style={{ textAlign: "right" as const }}>
                        <Text style={actHours}>{a.hoursSpent}h</Text>
                      </Column>
                    )}
                  </Row>
                  {a.category && <Text style={actMeta}>{a.category}</Text>}
                  {a.description && <Text style={actDesc}>{a.description}</Text>}
                </div>
              ))}
            </>
          )}

          {/* Parent Notes */}
          {parentNotes && (
            <>
              <Heading style={h2}>Parent Notes</Heading>
              <Section style={notesBox}>
                <Text style={notesText}>{parentNotes}</Text>
              </Section>
            </>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={reportUrl} style={button}>View Full Report in Dashboard</Link>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            This report was submitted via HomeschoolHub.{" "}
            <Link href={reportUrl} style={footerLink}>Open dashboard</Link>
          </Text>
          <Text style={{ ...footer, marginTop: "4px" }}>
            An HTML copy of this report is attached. Open it in any browser and use Print → Save as PDF.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default MonthlyReportEmail;

// ─── Styles ───────────────────────────────────────────────────────────────────
const main = {
  backgroundColor: "#f3f4f6",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0 0 40px",
  maxWidth: "640px",
  borderRadius: "8px",
  overflow: "hidden",
};
const header = {
  backgroundColor: "#1e293b",
  padding: "24px 32px",
};
const h1 = { color: "#f97316", fontSize: "22px", fontWeight: "700", margin: "0 0 4px" };
const headerSub = { color: "#94a3b8", fontSize: "13px", margin: "0" };
const noticeText = { fontSize: "15px", color: "#374151", padding: "24px 32px 0", margin: "0" };
const h2 = { fontSize: "15px", fontWeight: "700", color: "#111827", margin: "24px 32px 8px", textTransform: "uppercase" as const, letterSpacing: "0.05em" };
const infoBox = { margin: "0 32px", backgroundColor: "#f9fafb", borderRadius: "6px", padding: "12px 16px" };
const infoCell = { paddingRight: "20px" };
const infoLabel = { fontSize: "11px", color: "#6b7280", margin: "0 0 2px", textTransform: "uppercase" as const };
const infoValue = { fontSize: "15px", fontWeight: "600", color: "#111827", margin: "0" };
const evalRow = { margin: "0 32px 12px", borderLeft: "3px solid #e5e7eb", paddingLeft: "12px" };
const evalLabel = { fontSize: "12px", color: "#6b7280", margin: "0 0 2px" };
const evalAnswer = { fontSize: "14px", color: "#374151", margin: "0" };
const activityRow = { margin: "0 32px 10px", padding: "10px 14px", backgroundColor: "#f9fafb", borderRadius: "6px" };
const actTitle = { fontSize: "14px", fontWeight: "600", color: "#111827", margin: "0" };
const actHours = { fontSize: "14px", fontWeight: "700", color: "#f59e0b", margin: "0" };
const actMeta = { fontSize: "12px", color: "#6b7280", margin: "2px 0 0" };
const actDesc = { fontSize: "13px", color: "#374151", margin: "4px 0 0" };
const notesBox = { margin: "0 32px", backgroundColor: "#fefce8", borderRadius: "6px", padding: "12px 16px" };
const notesText = { fontSize: "14px", color: "#374151", margin: "0", lineHeight: "1.6" };
const ctaSection = { textAlign: "center" as const, margin: "32px 0 0" };
const button = {
  backgroundColor: "#f97316", borderRadius: "9999px", color: "#fff",
  fontSize: "14px", fontWeight: "600", textDecoration: "none",
  display: "inline-block", padding: "12px 28px",
};
const hr = { borderColor: "#e5e7eb", margin: "32px 0 20px" };
const footer = { fontSize: "12px", color: "#9ca3af", textAlign: "center" as const, margin: "0 32px" };
const footerLink = { color: "#f97316" };

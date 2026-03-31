import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";

interface StudentProgress {
  name: string;
  lessonsCompleted: number;
  averageScore: number;
  topCurriculum: string;
  recentActivities: Array<{
    type: string;
    lessonTitle: string;
    score?: number;
    timestamp: string;
  }>;
}

interface ParentDigestEmailProps {
  parentName: string;
  students: StudentProgress[];
  frequency: "daily" | "weekly";
  dashboardUrl: string;
  showLessons?: boolean;
  showScores?: boolean;
}

export const ParentDigestEmail = ({
  parentName = "Parent",
  students = [],
  frequency = "daily",
  dashboardUrl = "https://homeschoolhub.com/dashboard",
  showLessons = true,
  showScores = true,
}: ParentDigestEmailProps) => {
  const previewText = `Your ${frequency} learning update for ${students.map((s) => s.name).join(", ")}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Heading style={h1}>
            <span style={brandGradient}>HomeschoolHub</span>
          </Heading>

          <Text style={greeting}>Hi {parentName}! 👋</Text>

          <Text style={intro}>
            Here's your {frequency} update on your {students.length === 1 ? "child's" : "children's"} learning journey:
          </Text>

          {/* Student Progress Sections */}
          {students.map((student, index) => (
            <div key={index}>
              <Section style={studentSection}>
                <Heading style={h2}>🎓 {student.name}</Heading>

                {/* Stats */}
                {(showLessons || showScores) && (
                  <div style={statsContainer}>
                    {showLessons && (
                      <div style={statBox}>
                        <Text style={statNumber}>{student.lessonsCompleted}</Text>
                        <Text style={statLabel}>Lessons Completed</Text>
                      </div>
                    )}
                    {showScores && (
                      <div style={statBox}>
                        <Text style={statNumber}>{student.averageScore}%</Text>
                        <Text style={statLabel}>Average Score</Text>
                      </div>
                    )}
                  </div>
                )}

                {student.topCurriculum && (
                  <Text style={curriculumText}>
                    📚 Currently studying: <strong>{student.topCurriculum}</strong>
                  </Text>
                )}

                {/* Recent Activities */}
                {student.recentActivities.length > 0 && (
                  <>
                    <Text style={activitiesHeading}>Recent Activity:</Text>
                    {student.recentActivities.map((activity, actIndex) => (
                      <div key={actIndex} style={activityItem}>
                        <Text style={activityText}>
                          {activity.type === "lesson_completed" ? "✅" : "📖"}{" "}
                          <strong>{activity.lessonTitle}</strong>
                          {activity.score !== undefined && (
                            <span style={scoreText}> - {activity.score}%</span>
                          )}
                        </Text>
                        <Text style={activityTime}>{activity.timestamp}</Text>
                      </div>
                    ))}
                  </>
                )}
              </Section>

              {index < students.length - 1 && <Hr style={hr} />}
            </div>
          ))}

          {/* CTA */}
          <Section style={ctaSection}>
            <Link href={dashboardUrl} style={button}>
              View Full Dashboard
            </Link>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this {frequency} digest because you've chosen to get updates about your children's progress.
            <br />
            <Link href={`${dashboardUrl}/settings`} style={link}>
              Change email preferences
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ParentDigestEmail;

// Styles
const main = {
  backgroundColor: "#f9fafb",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  borderRadius: "8px",
};

const h1 = {
  color: "#111827",
  fontSize: "32px",
  fontWeight: "700",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const brandGradient = {
  background: "linear-gradient(to right, #f97316, #f59e0b)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const greeting = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#111827",
  margin: "30px 0 10px",
};

const intro = {
  fontSize: "16px",
  color: "#6b7280",
  lineHeight: "24px",
  margin: "0 0 30px",
};

const h2 = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 20px",
};

const studentSection = {
  padding: "20px 0",
};

const statsContainer = {
  display: "flex",
  gap: "20px",
  marginBottom: "20px",
};

const statBox = {
  flex: "1",
  textAlign: "center" as const,
  padding: "20px",
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
};

const statNumber = {
  fontSize: "32px",
  fontWeight: "700",
  color: "#f59e0b",
  margin: "0",
};

const statLabel = {
  fontSize: "14px",
  color: "#78716c",
  margin: "5px 0 0",
};

const curriculumText = {
  fontSize: "16px",
  color: "#6b7280",
  margin: "0 0 20px",
};

const activitiesHeading = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#111827",
  margin: "20px 0 10px",
};

const activityItem = {
  marginBottom: "12px",
};

const activityText = {
  fontSize: "15px",
  color: "#374151",
  margin: "0",
  lineHeight: "20px",
};

const scoreText = {
  color: "#16a34a",
  fontWeight: "600",
};

const activityTime = {
  fontSize: "13px",
  color: "#9ca3af",
  margin: "4px 0 0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "30px 0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "40px 0",
};

const button = {
  backgroundColor: "#f97316",
  borderRadius: "9999px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const footer = {
  fontSize: "14px",
  color: "#9ca3af",
  textAlign: "center" as const,
  lineHeight: "20px",
};

const link = {
  color: "#f97316",
  textDecoration: "underline",
};

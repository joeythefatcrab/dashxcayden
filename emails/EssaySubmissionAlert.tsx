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

interface EssaySubmissionAlertProps {
  parentName: string;
  studentName: string;
  essayTitle: string;
  submittedAt: string;
  reviewUrl: string;
}

export const EssaySubmissionAlert = ({
  parentName = "Parent",
  studentName = "Your student",
  essayTitle = "Essay",
  submittedAt = "",
  reviewUrl = "#",
}: EssaySubmissionAlertProps) => {
  return (
    <Html>
      <Head />
      <Preview>{studentName} submitted an essay for your review: {essayTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            <span style={brand}>HomeschoolHub</span>
          </Heading>

          <Text style={greeting}>Hi {parentName},</Text>
          <Text style={body}>
            <strong>{studentName}</strong> has submitted an essay for your review:
          </Text>

          <Section style={essayBox}>
            <Text style={essayTitle_style}>📝 {essayTitle}</Text>
            {submittedAt && (
              <Text style={submittedText}>Submitted: {submittedAt}</Text>
            )}
          </Section>

          <Section style={ctaSection}>
            <Link href={reviewUrl} style={button}>
              Review Submission
            </Link>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            This is an automated alert from HomeschoolHub.{" "}
            <Link href={reviewUrl.replace(/\/programs.*/, "/settings")} style={link}>
              Manage notification preferences
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default EssaySubmissionAlert;

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
  fontSize: "28px",
  fontWeight: "700",
  margin: "0 0 20px",
  textAlign: "center" as const,
};
const brand = {
  background: "linear-gradient(to right, #f97316, #f59e0b)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};
const greeting = { fontSize: "18px", fontWeight: "600", color: "#111827", margin: "24px 0 8px" };
const body = { fontSize: "15px", color: "#374151", lineHeight: "24px", margin: "0 0 20px" };
const essayBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "16px 20px",
  marginBottom: "24px",
};
const essayTitle_style = { fontSize: "16px", fontWeight: "600", color: "#92400e", margin: "0 0 4px" };
const submittedText = { fontSize: "13px", color: "#b45309", margin: "0" };
const ctaSection = { textAlign: "center" as const, margin: "32px 0" };
const button = {
  backgroundColor: "#f97316",
  borderRadius: "9999px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
  padding: "12px 28px",
};
const hr = { borderColor: "#e5e7eb", margin: "24px 0" };
const footer = { fontSize: "13px", color: "#9ca3af", textAlign: "center" as const, lineHeight: "20px" };
const link = { color: "#f97316", textDecoration: "underline" };

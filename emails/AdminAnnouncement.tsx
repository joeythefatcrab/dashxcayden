import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface AdminAnnouncementEmailProps {
  title?: string;
  content: string;
  senderName: string;
  orgName?: string;
  dashboardUrl: string;
}

export const AdminAnnouncementEmail = ({
  title = "Announcement",
  content = "",
  senderName = "Admin",
  orgName,
  dashboardUrl = "https://example.com/dashboard",
}: AdminAnnouncementEmailProps) => (
  <Html>
    <Head />
    <Preview>{title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={headerText}>{orgName || "HomeschoolHero"}</Text>
        </Section>

        <Section style={body}>
          <Heading style={h1}>{title}</Heading>
          <Hr style={hr} />
          {content.split("\n").map((line, i) =>
            line.trim() ? (
              <Text key={i} style={paragraph}>{line}</Text>
            ) : (
              <Text key={i} style={{ margin: "4px 0" }}>&nbsp;</Text>
            )
          )}
          <Hr style={hr} />
          <Section style={buttonSection}>
            <Button style={button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Sent by {senderName}{orgName ? ` · ${orgName}` : ""}
          </Text>
          <Text style={footerText}>
            You received this because you are enrolled in this program.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default AdminAnnouncementEmail;

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  maxWidth: "600px",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const header: React.CSSProperties = {
  backgroundColor: "#1a1a2e",
  padding: "24px 40px",
};

const headerText: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0",
};

const body: React.CSSProperties = {
  padding: "32px 40px",
};

const h1: React.CSSProperties = {
  color: "#1a1a2e",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const hr: React.CSSProperties = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const paragraph: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0 0 12px",
};

const buttonSection: React.CSSProperties = {
  textAlign: "center",
  marginTop: "24px",
};

const button: React.CSSProperties = {
  backgroundColor: "#1a1a2e",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

const footer: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  padding: "20px 40px",
  borderTop: "1px solid #e6ebf1",
};

const footerText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0 0 4px",
};

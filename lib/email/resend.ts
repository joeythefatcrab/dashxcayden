import { Resend } from "resend";

// Allow optional Resend setup - validation happens at runtime when sending emails
const apiKey = process.env.RESEND_API_KEY || "";

export const resend = new Resend(apiKey);

export const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

// Helper to check if Resend is configured
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

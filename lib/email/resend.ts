import { Resend } from "resend";

export const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

// Lazy-load Resend instance only when API key is available
let resendInstance: Resend | null = null;

export const resend = {
  get emails() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured. Email functionality is disabled.");
    }
    if (!resendInstance) {
      resendInstance = new Resend(process.env.RESEND_API_KEY);
    }
    return resendInstance.emails;
  }
};

// Helper to check if Resend is configured
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

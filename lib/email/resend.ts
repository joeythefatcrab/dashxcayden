import { Resend } from "resend";

// Allow optional Resend setup in development
const apiKey = process.env.RESEND_API_KEY || "";

if (!apiKey && process.env.NODE_ENV === "production") {
  throw new Error("RESEND_API_KEY environment variable is required in production");
}

export const resend = new Resend(apiKey);

export const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

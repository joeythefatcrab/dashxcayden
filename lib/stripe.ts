import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

// Price ID for Learnality Pro - $129.99/month per student
// You'll need to create this in Stripe Dashboard and add to .env
export const LEARNALITY_PRO_PRICE_ID = process.env.STRIPE_PRICE_ID || "";

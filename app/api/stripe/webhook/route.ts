import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Activate subscription
        if ((session as any).mode === "subscription") {
          await handleSubscriptionCreated(session);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(session: Stripe.Checkout.Session) {
  const userId = (session as any).metadata?.userId;
  const studentId = (session as any).metadata?.studentId;
  const subscriptionId = (session as any).subscription as string;

  if (!userId || !studentId || !subscriptionId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const periodEnd = (subscription as any).current_period_end;
  const priceId = (subscription as any).items?.data?.[0]?.price?.id;

  // Update parent with subscription info
  await db.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });

  // Activate student subscription
  await db.student.update({
    where: { id: studentId },
    data: {
      subscriptionActive: true,
      subscriptionEndDate: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });

  console.log(`Subscription activated for student ${studentId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = (subscription as any).metadata?.userId;
  const studentId = (subscription as any).metadata?.studentId;

  if (!userId || !studentId) {
    console.error("Missing metadata in subscription");
    return;
  }

  const isActive = (subscription as any).status === "active" || (subscription as any).status === "trialing";
  const periodEnd = (subscription as any).current_period_end;

  // Update parent subscription info
  await db.user.update({
    where: { id: userId },
    data: {
      stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });

  // Update student subscription status
  await db.student.update({
    where: { id: studentId },
    data: {
      subscriptionActive: isActive,
      subscriptionEndDate: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });

  console.log(`Subscription updated for student ${studentId}: ${(subscription as any).status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = (subscription as any).metadata?.userId;
  const studentId = (subscription as any).metadata?.studentId;

  if (!userId || !studentId) {
    console.error("Missing metadata in subscription");
    return;
  }

  // Deactivate student subscription
  await db.student.update({
    where: { id: studentId },
    data: {
      subscriptionActive: false,
    },
  });

  // Clear parent subscription info if this was their only subscription
  await db.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  });

  console.log(`Subscription cancelled for student ${studentId}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = (subscription as any).metadata?.userId;
  const studentId = (subscription as any).metadata?.studentId;
  const periodEnd = (subscription as any).current_period_end;

  if (!userId || !studentId) return;

  // Ensure subscription is active
  await db.student.update({
    where: { id: studentId },
    data: {
      subscriptionActive: true,
      subscriptionEndDate: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });

  console.log(`Payment succeeded for student ${studentId}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = (subscription as any).metadata?.userId;
  const studentId = (subscription as any).metadata?.studentId;

  if (!userId || !studentId) return;

  // Optionally deactivate after payment failure
  // For now, let Stripe's retry logic handle it
  console.log(`Payment failed for student ${studentId}`);
}

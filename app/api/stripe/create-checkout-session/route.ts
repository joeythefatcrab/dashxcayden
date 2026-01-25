import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, LEARNALITY_PRO_PRICE_ID } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Only parents can subscribe" }, { status: 403 });
    }

    const body = await req.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    // Get the correct base URL from the request headers
    const headersList = req.headers;
    const host = headersList.get("host") || "";
    const protocol = headersList.get("x-forwarded-proto") || "https";
    const baseUrl = `${protocol}://${host}`;

    // Fallback to environment variable if host is not available
    const appUrl = host ? baseUrl : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Verify student belongs to this parent
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    });

    if (!student || student.parentId !== session.user.id) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get or create Stripe customer
    const parent = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    let customerId = parent.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: parent.email,
        name: parent.name || undefined,
        metadata: {
          userId: parent.id,
        },
      });

      customerId = customer.id;

      // Save customer ID to database
      await db.user.update({
        where: { id: parent.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: LEARNALITY_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true, // Enable promo code input on checkout page
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${appUrl}/dashboard?canceled=true`,
      metadata: {
        userId: parent.id,
        studentId: student.id,
      },
      subscription_data: {
        metadata: {
          userId: parent.id,
          studentId: student.id,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

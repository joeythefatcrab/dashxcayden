# Stripe Integration Setup Guide

## ⚠️ CRITICAL SECURITY WARNING

**YOU MUST ROTATE YOUR LIVE API KEYS IMMEDIATELY**

Your live Stripe keys were exposed. Go to:
https://dashboard.stripe.com/apikeys

Click the "..." menu next to each key and select "Roll secret key"

## Step 1: Get TEST API Keys

For development, use **TEST** keys (not live keys):

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

## Step 2: Create Product and Price in Stripe

1. Go to https://dashboard.stripe.com/test/products
2. Click **"+ Add product"**
3. Fill in:
   - **Name**: Learnality Pro
   - **Description**: Per-student monthly subscription for unlimited access
   - **Pricing**: Recurring
   - **Price**: $129.99
   - **Billing period**: Monthly
4. Click **"Save product"**
5. **Copy the Price ID** (starts with `price_`) - you'll need this!

## Step 3: Set Up Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"+ Add endpoint"**
3. **Endpoint URL**: `https://your-domain.com/api/stripe/webhook`
4. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. **Copy the Webhook signing secret** (starts with `whsec_`)

## Step 4: Environment Variables

Add these to your `.env.local` file:

```env
# Stripe API Keys (USE TEST KEYS FOR DEVELOPMENT)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## Step 5: Run Database Migration

Run the SQL migration in your Neon database:

```bash
# Copy the contents of prisma/migrations/20260115_add_stripe_subscriptions.sql
# and run it in your Neon SQL Editor
```

Or if you have DATABASE_URL set:

```bash
npx prisma db push
```

## Step 6: Test the Integration

1. Start your app: `npm run dev`
2. Log in as a parent
3. You should see the subscription card on the dashboard
4. Click "Subscribe" on a student
5. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
6. Complete checkout
7. You should be redirected back and see the subscription as "Active"

## Step 7: Test Webhook Locally (Optional)

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://stripe.com/docs/stripe-cli
```

Forward webhooks to localhost:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook signing secret for local testing.

## How It Works

### For Parents:
1. Parent clicks "Subscribe" next to a student
2. Redirected to Stripe Checkout (secure payment page)
3. After successful payment, redirected back to dashboard
4. Webhook updates student subscription status in database
5. Parent can manage billing (cancel, update card, etc.) via "Manage Billing" button

### Subscription Enforcement:
- Currently, subscriptions are tracked but not enforced
- To enforce: Add middleware to check `student.subscriptionActive` before allowing access to lessons
- Consider adding a banner/modal for expired subscriptions

## For Production

When you're ready for production:

1. Switch to **Live** mode in Stripe dashboard
2. Get your **Live** API keys from https://dashboard.stripe.com/apikeys
3. Update your production environment variables
4. Set up webhook endpoint pointing to your production URL
5. Test thoroughly with real payment methods (you can refund test purchases)

## Billing Portal Features

Parents can:
- View invoice history
- Update payment method
- Cancel subscription
- Download invoices

All handled by Stripe's hosted billing portal - no custom UI needed!

## Support

If you encounter issues:
- Check Stripe Dashboard > Developers > Logs
- Check webhook endpoint logs
- Ensure webhook secret is correct
- Verify Price ID matches your product

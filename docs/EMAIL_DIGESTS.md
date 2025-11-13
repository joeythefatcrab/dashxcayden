# Email Digest System

## Overview

The email digest system sends periodic updates to parents about their children's learning progress. Parents can choose to receive daily, weekly, or no digests.

## Features

- **Daily Digests**: Sent every morning at 8 AM
- **Weekly Digests**: Sent every Monday at 9 AM
- **Customizable**: Parents can change their preferences in settings
- **Activity Summary**: Shows lessons completed, average scores, and recent activities
- **Multi-child Support**: Includes progress for all children in one email

## Architecture

### Components

1. **Email Templates** (`emails/ParentDigest.tsx`)
   - Beautiful HTML email using React Email
   - Shows student stats, recent activities, and scores

2. **Inngest Functions** (`lib/inngest/functions/parent-digest.ts`)
   - `sendParentDigest`: Generates and sends digest for one parent
   - `dailyDigestCron`: Cron job to trigger daily digests (8 AM)
   - `weeklyDigestCron`: Cron job to trigger weekly digests (Monday 9 AM)

3. **API Routes**
   - `/api/inngest`: Serves Inngest functions
   - `/api/digest/test`: Manual trigger for testing (parents only)
   - `/api/settings/email-preferences`: Update digest preferences

4. **Settings Page** (`app/(parent)/settings/page.tsx`)
   - UI for parents to manage email preferences
   - Test digest button to preview emails

## How It Works

### Scheduled Digests

1. Cron jobs run daily/weekly via Inngest
2. Query all parents with matching `digestFrequency` and `notifyEmail: true`
3. Trigger `digest/send.parent` event for each parent
4. Generate digest data:
   - Get all children for the parent
   - Filter attempts and activities by date range (1 day or 7 days)
   - Calculate stats: lessons completed, average score, top curriculum
   - Format recent activities with timestamps
5. Send email via Resend
6. Log digest to `DigestLog` table

### Manual Testing

Parents can test digests from Settings page:
1. Go to `/settings`
2. Configure digest preferences
3. Click "Send Test Email"
4. Check email inbox

## Environment Variables

Required environment variables:

```env
# Resend API Key for sending emails
RESEND_API_KEY=re_...

# Sender email (must be verified in Resend)
SENDER_EMAIL=noreply@yourdomain.com

# App URL for links in emails
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Inngest Event Key (for production)
INNGEST_EVENT_KEY=...

# Inngest Signing Key (for production)
INNGEST_SIGNING_KEY=...
```

## Database Schema

### User Model
- `digestFrequency`: "daily" | "weekly" | "none"
- `notifyEmail`: boolean
- `phoneNumber`: optional (for future SMS support)
- `notifySms`: boolean (for future SMS support)

### DigestLog Model
- `parentId`: User ID
- `type`: "daily" | "weekly"
- `sentAt`: timestamp
- `summary`: JSON with stats

## Development Setup

### 1. Install Dependencies

Already included in `package.json`:
- `inngest`
- `resend`
- `@react-email/components`
- `date-fns`

### 2. Configure Resend

1. Sign up at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Verify sender email/domain
4. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_your_key_here
   SENDER_EMAIL=noreply@yourdomain.com
   ```

### 3. Configure Inngest (for cron jobs)

#### Local Development

1. Install Inngest CLI:
   ```bash
   npx inngest-cli@latest dev
   ```

2. Start Next.js dev server:
   ```bash
   npm run dev
   ```

3. The Inngest dev server will detect your functions at `http://localhost:3000/api/inngest`

#### Production (Vercel)

1. Sign up at [inngest.com](https://inngest.com)
2. Get event key and signing key
3. Add to Vercel environment variables:
   ```
   INNGEST_EVENT_KEY=...
   INNGEST_SIGNING_KEY=...
   ```
4. Inngest will automatically sync your functions

### 4. Test Locally

1. Seed the database with test parent:
   ```bash
   npm run db:seed
   ```

2. Sign in as parent: `parent@homeschool.com` / `password123`

3. Go to `/settings` and configure digest preferences

4. Click "Send Test Email" to trigger a digest

5. Check the Inngest dev server UI to see function execution

## Testing

### Manual Test

```bash
curl -X POST http://localhost:3000/api/digest/test \
  -H "Content-Type: application/json" \
  -d '{"frequency":"daily"}' \
  -H "Cookie: your-session-cookie"
```

### Preview Email Template

Use React Email's preview server:

```bash
npx react-email dev
```

Open `http://localhost:3000` to see email templates.

## Troubleshooting

### Emails Not Sending

1. Check Resend API key is valid
2. Verify sender email in Resend dashboard
3. Check Inngest dev server is running locally
4. Look at function logs in Inngest dashboard

### Wrong Time Zone for Cron

Inngest cron uses UTC by default. Adjust cron schedule:
- `0 8 * * *` = 8 AM UTC
- `0 13 * * *` = 8 AM EST (UTC-5)

### No Activity in Digest

Digests are skipped if:
- Parent has no children
- No lessons completed in time period
- All students have 0 attempts

Check the function logs to see skip reason.

## Future Enhancements

- [ ] SMS notifications via Twilio
- [ ] Custom digest schedules (e.g., bi-weekly)
- [ ] Activity highlights and achievements
- [ ] Digest preview in dashboard
- [ ] Unsubscribe links in emails
- [ ] A/B test email templates
- [ ] Real-time notifications for milestones

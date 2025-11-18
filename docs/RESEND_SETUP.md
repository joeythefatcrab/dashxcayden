# Resend Email Setup Guide

This guide will help you set up Resend for sending emails from your Homeschool SaaS platform.

## Overview

Resend is used for sending:
- **Student invitation emails** - When parents invite students to join
- **Parent digest emails** - Daily/weekly progress summaries
- **Future notifications** - Account updates, reminders, etc.

**Free Tier:** 3,000 emails/month, 100 emails/day

---

## Quick Setup (5 minutes)

### Step 1: Create a Resend Account

1. Go to **https://resend.com/signup**
2. Sign up with your email or GitHub account
3. Verify your email address
4. You'll be redirected to the Resend dashboard

### Step 2: Generate an API Key

1. In the Resend dashboard, click **"API Keys"** in the left sidebar
2. Click the **"Create API Key"** button
3. Fill in the details:
   - **Name:** `Homeschool App` (or any name you prefer)
   - **Permission:** Select **"Sending access"**
   - **Domain:** Select "All domains" (or choose a specific domain if you've added one)
4. Click **"Create"**
5. **Copy the API key** (it starts with `re_...`)
   - ⚠️ **Important:** You won't be able to see this key again, so save it now!

### Step 3: Configure Your Environment Variables

1. Open your `.env.local` file in the project root
2. Find the Resend section:
   ```bash
   RESEND_API_KEY="re_YOUR_API_KEY_HERE"
   RESEND_FROM_EMAIL="onboarding@resend.dev"
   ```
3. Replace `re_YOUR_API_KEY_HERE` with your actual API key from Step 2
4. **Save the file**

### Step 4: Restart Your Development Server

Stop your dev server (Ctrl+C) and start it again:
```bash
npm run dev
```

### Step 5: Test Your Setup

1. Sign in to your app as a parent user
2. Go to **http://localhost:3000/parent/test-email**
3. Click **"Send Test Email"**
4. Check your inbox for the test email

✅ If you receive the email, setup is complete!

---

## Production Setup (Recommended)

For production, you should use your own domain instead of `onboarding@resend.dev`.

### Add Your Domain to Resend

1. In Resend dashboard, go to **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Resend will provide DNS records to add
5. Add these records to your domain's DNS settings:
   - SPF record
   - DKIM records
   - DMARC record (optional but recommended)
6. Wait for verification (usually 5-30 minutes)
7. Once verified, update your `.env.local`:
   ```bash
   RESEND_FROM_EMAIL="noreply@yourdomain.com"
   ```

### For Vercel Deployment

Add the environment variables in your Vercel project settings:

1. Go to your project in Vercel dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add these variables:
   ```
   RESEND_API_KEY=re_your_actual_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```
4. Redeploy your app

---

## Email Features in Your App

### 1. Student Invitations

**Location:** `/parent/students`

When a parent invites a student:
- An email is sent with a secure invitation link
- Link expires in 7 days
- Student can create an account by clicking the link
- Auto-enrolls in assigned courses

**Email includes:**
- Personalized greeting
- Invitation link
- List of courses they'll be enrolled in
- Expiration notice

### 2. Parent Digests (Future)

**Location:** `/settings`

Parents can receive:
- **Daily digests** - Every day at 8 AM
- **Weekly digests** - Every Monday at 9 AM

**Email includes:**
- Number of lessons completed
- Average scores
- Top performing curriculum
- Recent activity by each child

---

## Troubleshooting

### "Resend is not configured" Error

**Problem:** The app can't find your API key.

**Solutions:**
1. Check that `.env.local` exists in the project root
2. Verify the API key is set correctly: `RESEND_API_KEY="re_..."`
3. Make sure you restarted the dev server after adding the key
4. Check for typos in the environment variable name

### Emails Not Sending

**Check these:**

1. **API Key Valid?**
   - Log in to Resend dashboard
   - Go to API Keys
   - Verify the key hasn't been revoked

2. **Correct Sender Email?**
   - For development: Use `onboarding@resend.dev`
   - For production: Use your verified domain

3. **Rate Limits?**
   - Free tier: 100 emails/day
   - Check Resend dashboard for usage stats

4. **Check Logs:**
   - In development, check your terminal for error messages
   - In production, check Vercel logs

### Emails Going to Spam

**To fix:**

1. **Verify your domain** in Resend (production only)
2. **Add all DNS records** (SPF, DKIM, DMARC)
3. **Use a professional sender address** (e.g., `noreply@yourdomain.com`)
4. **Don't use free email services** as sender (e.g., no Gmail/Yahoo addresses)

### "Invalid API Key" Error

**Solutions:**
1. The API key was copied incorrectly - copy it again from Resend
2. The API key was revoked - create a new one
3. Extra spaces in `.env.local` - remove any spaces around the key

---

## Testing Emails in Development

### Option 1: Use the Test Email Page

1. Go to `http://localhost:3000/parent/test-email`
2. Enter your email or leave blank
3. Click "Send Test Email"
4. Check your inbox

### Option 2: Test Student Invitations

1. Go to `http://localhost:3000/parent/students`
2. Click "Invite Student"
3. Enter a test email (your own)
4. Select some courses (optional)
5. Click "Send Invitation"
6. Check your email for the invitation

### Option 3: Console Logging (Fallback)

If `RESEND_API_KEY` is not set, the app will:
- Log invitation links to the console
- Not send actual emails
- Still create invitations in the database

This is useful for testing without email setup.

---

## API Usage

### Send Test Email

**Endpoint:** `POST /api/test-email`

**Request:**
```json
{
  "email": "test@example.com"  // Optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "emailId": "abc123",
  "sentTo": "test@example.com",
  "configured": true
}
```

**Response (Not Configured):**
```json
{
  "error": "Resend is not configured...",
  "configured": false
}
```

### Send Student Invitation

**Endpoint:** `POST /api/parent/invite-student`

**Request:**
```json
{
  "studentEmail": "student@example.com",
  "studentName": "John Doe",
  "curriculaIds": ["curriculum-id-1", "curriculum-id-2"]
}
```

---

## Cost Estimates

### Free Tier (Resend)
- **3,000 emails/month**
- **100 emails/day**
- Perfect for small homeschool operations

**Example usage:**
- 10 student invitations/week = ~40/month
- 5 parents with daily digests = ~150/month
- **Total:** ~200 emails/month (well within free tier)

### Paid Tier (if needed)
- $20/month for 50,000 emails
- $80/month for 100,000 emails
- Only needed for large-scale operations

---

## Security Best Practices

1. **Never commit `.env.local`** to Git
   - Already in `.gitignore`
   - Never share API keys publicly

2. **Rotate API keys regularly**
   - Create new key every 3-6 months
   - Delete old keys from Resend dashboard

3. **Use environment-specific keys**
   - Different key for development vs production
   - Name them clearly in Resend dashboard

4. **Monitor usage**
   - Check Resend dashboard regularly
   - Set up alerts for unusual activity

---

## Support

- **Resend Documentation:** https://resend.com/docs
- **Resend Status:** https://resend.com/status
- **Resend Support:** support@resend.com

For app-specific issues, check the main README or create an issue in your repository.

---

## Summary Checklist

- [ ] Sign up for Resend account
- [ ] Create API key with "Sending access"
- [ ] Add `RESEND_API_KEY` to `.env.local`
- [ ] Set `RESEND_FROM_EMAIL` (use `onboarding@resend.dev` for dev)
- [ ] Restart dev server
- [ ] Test at `/parent/test-email`
- [ ] Verify test email received
- [ ] (Optional) Add custom domain for production
- [ ] (Optional) Add environment variables to Vercel

🎉 Once complete, your email system is ready to use!

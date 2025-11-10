# Vercel Deployment Guide

## Quick Setup (5 minutes)

### Step 1: Generate AUTH_SECRET

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Copy the output - you'll paste it into Vercel.

Or run the helper script:
```bash
./scripts/generate-auth-secret.sh
```

### Step 2: Get Database URL

1. Go to **https://neon.tech**
2. Sign up (free)
3. Click **"Create a project"**
   - Name: `homeschool-saas`
   - Choose your region
4. **Copy the connection string** shown on the dashboard
   - Format: `postgresql://user:pass@ep-...neon.tech/neondb?sslmode=require`

### Step 3: Deploy to Vercel

1. Go to **https://vercel.com**
2. Sign in with GitHub
3. Click **"Add New..."** → **"Project"**
4. Import: **`joeythefatcrab/dashxcayden`**
5. Click **"Deploy"** (don't configure anything yet)

### Step 4: Add Environment Variables

After deployment, go to: **Project Settings → Environment Variables**

Add these **3 required variables**:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Your Neon connection string from Step 2 |
| `AUTH_SECRET` | Your generated secret from Step 1 |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g., `https://dashxcayden.vercel.app`) |

Click **"Save"** after each one.

### Step 5: Redeploy

1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**

### Step 6: Initialize Database

**Option A - Via Vercel CLI** (easiest):

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull

# Push database schema
pnpm db:push

# Seed sample data (optional)
pnpm db:seed
```

**Option B - Manually**:

Create a temporary `.env.production` file (don't commit):

```env
DATABASE_URL="your-neon-connection-string"
```

Then run:

```bash
pnpm db:push
pnpm db:seed
```

Delete `.env.production` after.

---

## ✅ You're Live!

Visit your Vercel URL: `https://your-app.vercel.app`

---

## Optional: Enable Full Features

### Google Sign-In

1. Go to **https://console.cloud.google.com**
2. Create a project
3. **APIs & Services** → **Credentials** → **Create OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add authorized redirect URI:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
6. Copy **Client ID** and **Client Secret**
7. Add to Vercel environment variables:
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
8. Redeploy

### File Uploads (UploadThing)

1. Go to **https://uploadthing.com**
2. Sign up and create an app
3. Copy your **Secret** and **App ID**
4. Add to Vercel:
   - `UPLOADTHING_SECRET`
   - `UPLOADTHING_APP_ID`
5. Redeploy

### Email (Resend)

1. Go to **https://resend.com**
2. Sign up and create an API key
3. Verify your domain (or use sandbox for testing)
4. Add to Vercel:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` (e.g., `noreply@yourdomain.com`)
5. Redeploy

### Background Jobs (Inngest)

1. Go to **https://inngest.com**
2. Sign up and get your keys
3. Add to Vercel:
   - `INNGEST_EVENT_KEY`
   - `INNGEST_SIGNING_KEY`
4. Redeploy

---

## Troubleshooting

### Build fails with "DATABASE_URL not found"

- Make sure you added `DATABASE_URL` to environment variables
- Redeploy after adding

### "Prisma Client not generated"

The build command automatically runs `prisma generate`. If it fails:
- Check your Neon database is accessible
- Verify connection string format

### Can't connect to database

- Ensure connection string includes `?sslmode=require`
- Check Neon project is active (not paused)

### Auth not working

- Verify `AUTH_SECRET` is set
- Check `NEXT_PUBLIC_APP_URL` matches your Vercel URL
- For Google OAuth, verify redirect URI matches exactly

---

## Environment Variables Reference

See `.env.vercel` file for complete list with descriptions.

## Auto-Deploy

Every push to your branch will automatically deploy to Vercel!

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will build and deploy automatically.

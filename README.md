# Homeschool SaaS MVP

An adaptive homeschool curriculum platform with intelligent pacing, auto-grading, glossary hovers, and parent reporting.

## Features

- **Curriculum Upload & Parsing**: Upload PDF/Docx/CSV curricula and parse into structured lessons
- **Adaptive Pacing**: Gate lesson access based on previous performance thresholds
- **Auto-Grading**: MCQ and short-answer grading with rule-based logic
- **Hover Glossary**: Per-word definitions with derivations and media previews
- **Parent Digests**: Daily/weekly email summaries of student progress
- **Provider Reporting**: Export CSV reports for compliance and progress tracking

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **Auth**: Auth.js v5 (email + Google OAuth)
- **File Upload**: UploadThing
- **Styling**: Tailwind CSS + shadcn/ui
- **Email**: Resend + React Email
- **Background Jobs**: Inngest
- **Testing**: Vitest (unit) + Playwright (e2e)

## Setup Instructions

### 1. Prerequisites

- Node.js 18.17+ and pnpm 8+
- PostgreSQL database (recommended: [Neon](https://neon.tech) free tier)

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd dashxcayden
pnpm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the following in `.env`:

**Database (Neon)**:
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

**Auth.js**:
```bash
# Generate a secret
openssl rand -base64 32
# Set as AUTH_SECRET
```

**Google OAuth** (optional for Google sign-in):
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret to `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`

**UploadThing**:
1. Sign up at [uploadthing.com](https://uploadthing.com)
2. Create an app
3. Copy token and app ID to `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`

**Resend Email**:
1. Sign up at [resend.com](https://resend.com)
2. Create API key
3. Add to `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` (use their sandbox or verify your domain)

**Inngest** (for background jobs):
1. Sign up at [inngest.com](https://inngest.com)
2. Get event and signing keys
3. Add to `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`

### 4. Database Setup

Push the schema to your database:

```bash
pnpm db:push
```

Seed with sample data:

```bash
pnpm db:seed
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Run production build |
| `pnpm lint` | Run ESLint |
| `pnpm db:push` | Push Prisma schema to DB (dev) |
| `pnpm db:migrate` | Create a migration |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run e2e tests (Playwright) |
| `pnpm test:e2e:ui` | Run e2e tests with UI |

## Project Structure

```
dashxcayden/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes (sign-in, onboarding)
│   ├── (student)/           # Student dashboard & lesson player
│   ├── (teacher)/           # Teacher/admin dashboard
│   └── api/                 # API routes
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   ├── auth/               # Auth components
│   ├── curriculum/         # Upload & curriculum components
│   ├── assignment/         # Assignment player components
│   └── glossary/           # Glossary hover components
├── lib/                    # Utilities & core logic
│   ├── parsers/           # PDF/Docx/CSV parsers
│   ├── grading/           # Auto-grading logic
│   ├── gating/            # Adaptive pacing logic
│   └── email/             # Email templates & sending
├── server/                # Server actions & queries
│   ├── actions/          # Server actions
│   └── queries/          # Database queries
├── prisma/               # Database schema & migrations
│   ├── schema.prisma    # Prisma schema
│   └── seed.ts          # Seed script
└── tests/               # Tests
    ├── unit/           # Unit tests (Vitest)
    └── e2e/            # E2E tests (Playwright)
```

## Development Workflow

Each feature is developed in small, testable increments:

1. **Module A**: Auth + Layout (roles, protected routes, onboarding)
2. **Module B**: Curriculum Upload & Parsing (file handling, parser, import)
3. **Module C**: Adaptive Gating + Assignment Player (lesson access, grading)
4. **Module D**: Glossary Hover (term definitions, hover cards)
5. **Module E**: Parent Digests (email cron, daily/weekly summaries)
6. **Module F**: Provider Reporting (CSV export, progress tracking)

## Testing

### Unit Tests

```bash
pnpm test
```

Focus areas:
- Grading logic (MCQ, short-answer matching)
- Gating logic (threshold checks, unlock flow)
- Parser logic (CSV/PDF/Docx to structured data)

### E2E Tests

```bash
pnpm test:e2e
```

Key flows:
- Teacher: Upload curriculum → import → assign to student
- Student: Complete lesson → get graded → unlock next
- Parent: View digest → export report

## Production Deployment

Recommended: Deploy to [Vercel](https://vercel.com)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

Database: Use Neon or Supabase for managed Postgres.

## License

MIT

## Support

For issues and questions, open a GitHub issue or contact support.

# Feature TODO — DashxCayden Homeschool Platform

> Last updated: 2026-02-27
> Primary goal this sprint: **Monthly report format overhaul**

---

## 🔴 P1 — Monthly Report Format (Primary Goal This Sprint)

The AI-generated monthly report already exists and generates valid APS-compliant content, but the **display format needs a major upgrade** from a raw monospace text dump to a professional, print-ready layout.

### 1.1 — Print-Ready HTML Report Renderer
- [ ] Replace the current `whitespace-pre-wrap` text blob in `MonthlyReportViewer.tsx` with a structured HTML report layout
- [ ] Design distinct visual sections: header, attendance calendar, summary, educator evaluation, subject breakdown table, external activities, comments
- [ ] Build a proper **attendance calendar grid** (day-numbered boxes with P/A/S/V color coding) rendered from `dailyAttendance` data
- [ ] Render the **subject breakdown as a proper HTML table** with borders and aligned columns (Subject | Description | Time)
- [ ] Add a print stylesheet (`@media print`) that hides UI chrome (nav, buttons, selectors) so `window.print()` produces a clean document
- [ ] Style the report header with student name, parent name, grade, and report period in a professional letterhead format

### 1.2 — PDF Export
- [ ] Add a proper **"Export as PDF"** button using a library like `react-pdf` or `@react-pdf/renderer`, or a server-side PDF generation API route
- [ ] Alternatively use the browser print-to-PDF flow with a polished print stylesheet (simpler, already partially wired via `handlePrint`)
- [ ] Ensure the PDF matches APS compliance formatting (the existing `generate-report/route.ts` prompt already targets this)

### 1.3 — Auto-Send Monthly Reports by Email
- [ ] Add an Inngest scheduled function that runs on the 1st of each month
- [ ] Function should: generate the report for the prior month → save to DB → email the PDF/formatted report to the parent
- [ ] Add email preference toggle in parent settings: "Auto-send monthly report" (on/off)
- [ ] Create a `MonthlyReportEmail` React Email template (similar to `ParentDigest.tsx`) that renders the report in a clean HTML email

### 1.4 — Report Data Completeness
- [ ] Ensure **non-app time** (time logged via `DailyTimeLog` without a curriculum ID) flows into the subject breakdown correctly
- [ ] Map external activity categories to APS subject names (e.g., "PE" activities map to the PE row in the subject table)
- [ ] Verify daily attendance auto-seeding logic (already in codebase) is working correctly and not double-counting school days

---

## 🟠 P2 — Full Curriculum Import (Jace / Taliya's Student)

The platform needs Jace's full remaining curriculum added, including **non-computer-based activities** (paper-based, offline). Taliya will email the list.

### 2.1 — Import Jace's Remaining Curriculum
- [ ] **Waiting on Taliya** to email the spreadsheet/list of remaining courses & tasks
- [ ] Once received, use the admin `CourseEditor` to add all remaining units and lessons per course
- [ ] Mark non-computer lessons appropriately (e.g., a flag like `isOffline: true` or use an existing type like `external`)

### 2.2 — Non-Computer Activity Support in Curriculum
- [ ] Audit the `Lesson` model item types — confirm there's a way to represent paper-based / offline tasks
- [ ] If not, add an `isOffline` boolean or `activityType` enum to the `Lesson` model in `prisma/schema.prisma`
- [ ] In the student lesson player, show offline lessons with a "Mark as Complete" checkbox rather than a video/quiz interface
- [ ] Ensure offline lesson completions still record `Attempt` records for progress tracking and reporting

### 2.3 — Curriculum Check Sheet / Progress View
- [ ] Verify `CurriculumChecksheetGenerator.tsx` and `PDFChecklistGenerator.tsx` are fully functional
- [ ] Add the ability to export a check sheet PDF for Jace's full curriculum (mirrors the paper check sheet currently used)
- [ ] Make check sheet show completion status per lesson across all enrolled curricula

---

## 🟡 P3 — Weekly Newsletter (Platform Development Updates)

Currently the platform has a **parent activity digest** (daily/weekly child progress email via Inngest). This is separate from a **platform development newsletter** for all users.

### 3.1 — Platform Newsletter Email Template
- [ ] Create a new `PlatformNewsletter.tsx` React Email template for development update announcements
- [ ] Fields: release notes / what's new, upcoming features, tips for using the platform
- [ ] Design should match brand (orange/amber palette, clean layout)

### 3.2 — Newsletter Send API & Admin UI
- [ ] Add API route `POST /api/admin/newsletter/send` that sends the newsletter to all active parent accounts
- [ ] Add a simple newsletter compose UI in the admin dashboard (title + body text field + preview + send button)
- [ ] Store sent newsletters in DB with date sent and recipient count (simple audit log)

### 3.3 — Newsletter Opt-Out
- [ ] Add "Platform newsletter" opt-in/out to the parent email preferences settings page (`EmailPreferencesForm.tsx`)
- [ ] Honor opt-out status in the send API

---

## 🟡 P4 — Additional Parent Account / Multi-Child Support

Taliya needs an additional account (or multi-student support on her current account) to log time for her **younger child (Dio)**.

### 4.1 — Verify Multi-Child Support
- [ ] Confirm that a single parent account can have multiple students (the schema supports `Student[]` per `User`) — appears to already work
- [ ] Test adding a second student to Taliya's account through the parent dashboard `StudentManager.tsx`

### 4.2 — Add Student for Dio (Younger Child)
- [ ] Confirm with John and Caroline before creating the account (per meeting notes)
- [ ] Once approved, Cayden to create the student record and link to Taliya's parent account
- [ ] Optionally assign a student login for Dio if desired

### 4.3 — Per-Child Time Logging for Parents
- [ ] In the parent's external activity / time logging interface, ensure the student selector always defaults to the correct child when multiple children exist
- [ ] Add a "log time for student" shortcut on the parent dashboard that pre-selects the child

---

## 🟢 P5 — Production Quality Sprint (General Stability & Polish)

Target: bring the platform to production quality within ~1 month.

### 5.1 — Bug Fixes & Stability
- [ ] Audit all `alert()` calls in the frontend — replace with proper toast notifications (the codebase uses alert() in several places in `MonthlyReportViewer.tsx` and others)
- [ ] Add global error boundaries to prevent white-screen crashes
- [ ] Review all API routes for missing auth checks
- [ ] Test the full student flow: sign up → enroll → complete lesson → parent views progress → generate report

### 5.2 — UX Improvements
- [ ] Add loading skeleton states to the parent dashboard cards (currently uses a spinner in some places, missing in others)
- [ ] Improve the mobile/responsive layout — platform needs to work well before the iPad app
- [ ] Ensure dark mode works consistently across all new components (some hardcoded colors noted in git log)

### 5.3 — Performance
- [ ] Audit slow API routes — particularly `monthly-report` which does multiple DB queries in sequence
- [ ] Add pagination to any lists that could grow large (activities list, time logs)

### 5.4 — Onboarding Flow
- [ ] Review the `/onboarding` page — make sure it guides new parents through: adding a student → assigning curriculum → logging first activity
- [ ] Add a checklist/progress indicator to onboarding so parents know what steps remain

---

## 🔵 P6 — Subscription & Monetization

### 6.1 — Stripe Subscription
- [ ] Verify Stripe webhook handling is working in production (schema has `stripeSubscriptionId`, `stripePriceId`, etc.)
- [ ] Test the full subscribe → access → cancel flow
- [ ] Ensure students with inactive subscriptions (`subscriptionActive: false`) are properly gated from content

### 6.2 — Subscription Plans
- [ ] Define pricing tiers (per student? per family?)
- [ ] Make the subscription UI clear on what's included at each tier

---

## 🔵 P7 — iPad App (6-Month Timeline)

Per meeting notes, Cayden will lead iOS development. Timeline is estimated at 6 months due to recoding requirements and Apple App Store review process.

### 7.1 — Planning
- [ ] Determine scope for v1 iPad app (read-only dashboard? full lesson player? time logging?)
- [ ] Decide on framework: React Native (reuses existing React knowledge), Expo, or Swift
- [ ] The app will also work on iPhone (same Apple developer account)

### 7.2 — Parental Controls / Guided Access Integration
- [ ] Research iOS Guided Access API for limiting student device usage
- [ ] Design a "student mode" feature: lock to the app with time limits, no internet browsing

---

## ✅ Already Implemented (Reference)

These features are live and working:

- Student lesson player with units, steps, quizzes, short answers, and file attachments
- AI auto-grading for short answer questions
- Essay submission, revision workflow, and parent grading
- Time tracking interface (manual daily time log + automatic lesson timing)
- External activities form (field trips, reading, etc.) linked to monthly reports
- Attendance tracking with daily P/A/S/V marking
- AI-generated monthly report (APS format, plain text)
- Parent digest emails (daily/weekly) via Inngest + Resend
- AI curriculum generator and CSV importer
- Glossary with hover tooltips
- Student notes system
- Loopi AI chatbot for students
- AI progress insights for parents
- Admin course editor (add/remove units, lessons, reorder)
- Parent curriculum access control
- Stripe billing integration (schema + checkout)
- Superadmin impersonation and user management
- Dark/light theme toggle

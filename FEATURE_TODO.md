# Feature TODO — DashxCayden Homeschool Platform

> Last updated: 2026-02-27
> Primary goal this sprint: **Monthly report format overhaul**
> Next major feature: **Yearly curriculum program with full nested course structure**

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

## 🟠 P2 — Yearly Curriculum Program (Full Student Curriculum on the Platform)

The goal is to load a student's **entire yearly curriculum** as a single program on the platform, with every individual course (subject) nested under it. The student works through each course sequentially or in parallel. This is a comprehensive multi-phase feature.

**Current state:** The platform has individual `Curriculum` (course) objects. Students enroll per-course. There is no grouping concept above a single course.

**Target state:** A `Program` (yearly plan) contains many courses. The student enrolls in the program and gets access to all courses at once. The program shows overall completion progress, each course shows per-course progress, and every course has units/lessons the student works through — including offline/paper-based tasks.

---

### 2.1 — Data Model: Add Program Layer
> **Database schema changes — requires Prisma migration**

- [ ] Add `Program` model to `prisma/schema.prisma`:
  ```
  Program
  ├── id, name, description
  ├── academicYear (e.g. "2025-2026")
  ├── createdById (admin/parent who set it up)
  ├── isActive
  ├── createdAt, updatedAt
  ├── programCourses: ProgramCourse[]   ← ordered list of courses
  └── enrollments: ProgramEnrollment[]  ← students in this program
  ```
- [ ] Add `ProgramCourse` join model (Program ↔ Curriculum with ordering):
  ```
  ProgramCourse
  ├── id
  ├── programId → Program
  ├── curriculumId → Curriculum
  ├── order (display order within the program)
  └── isRequired (vs optional/elective)
  ```
- [ ] Add `ProgramEnrollment` model (Student enrolled in a Program):
  ```
  ProgramEnrollment
  ├── id
  ├── programId → Program
  ├── studentId → Student
  ├── enrolledAt
  └── completedAt (null until done)
  ```
- [ ] Run `prisma migrate dev` to apply schema changes
- [ ] Update Prisma client types throughout the codebase

---

### 2.2 — Admin: Program Builder UI
> **Where:** New page under `/app/(admin)/programs/` and new components under `components/curriculum/`

- [ ] **Program list page** (`/programs`) — list all programs, show course count and enrolled student count per program
- [ ] **New program form** — name, academic year, description
- [ ] **Program editor page** (`/programs/[id]/edit`) — the main builder:
  - [ ] Left panel: course list (all available curricula), searchable
  - [ ] Right panel: courses added to this program, drag-to-reorder
  - [ ] "Add course to program" button — picks from existing curricula or creates a new one inline
  - [ ] Toggle `isRequired` per course
  - [ ] Show total estimated hours (sum of all courses' time estimates)
- [ ] **Assign program to student** — button/dialog on the program page or on the student profile page; creates a `ProgramEnrollment` and also creates individual `Enrollment` records for every course in the program
- [ ] **Remove course from program** — with warning if any students are enrolled

---

### 2.3 — Admin: Course Content Entry (Per Course)
> **Where:** Existing `CourseEditor` at `/curricula/[id]/edit` — extend it

- [ ] **Waiting on Taliya** to email the spreadsheet/list of remaining courses & tasks for Jace
- [ ] Once received, enter each subject as a `Curriculum` with its full `Unit → Lesson` structure:
  - Every unit = a chapter/section of the subject
  - Every lesson = an individual task, assignment, or assessment within that unit
- [ ] For each course, set the `subject` field to the matching APS category (for reporting)
- [ ] For offline/paper-based courses (spelling, handwriting, etc.) — see section 2.4

**Courses to enter (pending Taliya's list):**
- [ ] Mathematics (all remaining units/lessons)
- [ ] Reading / Literature
- [ ] Vocabulary
- [ ] Handwriting *(offline — see 2.4)*
- [ ] Creative Writing / Essays
- [ ] Grammar
- [ ] Spelling *(offline — may be excluded per meeting notes)*
- [ ] Geography
- [ ] American/World History
- [ ] Science
- [ ] Government/Civics
- [ ] PE / Physical Education *(offline)*
- [ ] Any remaining electives from Taliya's list

---

### 2.4 — Offline / Paper-Based Lesson Support
> **Database + lesson player changes**

- [ ] Add `isOffline boolean @default(false)` field to the `Lesson` model in `prisma/schema.prisma`
- [ ] Add `lessonType` enum or string to distinguish: `ONLINE` | `OFFLINE_CHECKBOX` | `OFFLINE_PARENT_SIGNOFF`
  - `ONLINE` — normal interactive lesson with quizzes/video (current behavior)
  - `OFFLINE_CHECKBOX` — student clicks "Mark as Done" (no quiz, just a completion record)
  - `OFFLINE_PARENT_SIGNOFF` — requires parent to mark it complete (for things like oral reading, PE activities)
- [ ] In `components/lesson-player.tsx`:
  - Detect `isOffline` / `lessonType` and render appropriately
  - `OFFLINE_CHECKBOX`: show the lesson description/instructions + a single "Mark Complete" button
  - `OFFLINE_PARENT_SIGNOFF`: show "Awaiting parent sign-off" state for student; show sign-off button for parent in their dashboard
- [ ] Ensure offline completions still create an `Attempt` record (score = 100, timeSpent = 0) so they count in progress tracking and monthly reports
- [ ] In the `CourseEditor`, add a "Lesson Type" selector when creating/editing a lesson

---

### 2.5 — Student UI: Program Dashboard
> **Where:** New page `/app/(student)/my-program/` + new components

- [ ] **Program overview page** — when a student is enrolled in a program, this becomes their primary home view:
  - Show program name and academic year
  - Overall completion progress bar (% of all lessons across all courses done)
  - Grid/list of all courses with per-course progress bars
  - Color-coded status per course: Not Started / In Progress / Complete
- [ ] **Course detail view** — clicking a course goes to the existing `/my-courses/[curriculumId]` page (already built) — no change needed here
- [ ] **"Next lesson" quick-start button** — shows the student the next incomplete lesson across their entire program (not just one course), so they always know where to pick up
- [ ] Update the student navigation sidebar to show "My Program" link if enrolled in one
- [ ] Graceful fallback: if a student has no program enrollment, show the current `My Courses` view (individual course list)

---

### 2.6 — Parent UI: Program Progress Overview
> **Where:** Extend `StudentProgressDashboard.tsx` + parent student profile page

- [ ] In the parent's student profile page (`/students/[id]`), add a "Program Progress" section showing:
  - Program name and overall completion %
  - Per-course breakdown: lessons complete / total lessons, hours logged, last activity date
  - Visual progress bars per course
- [ ] Add a "Program" tab or section to the parent dashboard so they can see all their students' program progress at a glance
- [ ] Ensure the monthly report's subject breakdown pulls course data from the program structure (already done via courseStats, but verify all enrolled courses appear)

---

### 2.7 — Bulk Import from Spreadsheet
> **Where:** New API route + admin UI component**

The realistic path for loading Taliya's curriculum: Cayden and Dash enter it manually using the CourseEditor. BUT for future families, a bulk import flow saves huge amounts of time.

- [ ] Define a CSV template format for bulk curriculum import:
  ```
  Program Name | Academic Year | Course Name | Subject | Unit Title | Unit Order | Lesson Title | Lesson Order | Lesson Type | Description
  ```
- [ ] Build a `ProgramImporter` component in the admin area:
  - Upload CSV → preview parsed structure → confirm → create all Program/Curriculum/Unit/Lesson records in one transaction
- [ ] Add API route `POST /api/admin/programs/import` that accepts the CSV and creates the full structure
- [ ] Handle duplicates: if a curriculum with the same name already exists, offer to link to it vs. create new

---

### 2.8 — Progress Tracking & Completion Logic
> **Affects:** Enrollment, Attempt, and ProgramEnrollment logic

- [ ] Calculate program-level completion %:
  - `completedLessons / totalLessons` across all courses in the program
  - Expose via `GET /api/student/program-progress` (returns per-course and overall stats)
- [ ] Mark a course complete when all required lessons have a passing `Attempt`
- [ ] Mark the program complete when all required courses are complete → set `ProgramEnrollment.completedAt`
- [ ] Emit a "program complete" notification to the parent when the student finishes
- [ ] Handle the edge case where new lessons are added to a course mid-year (recalculate totals without resetting progress)

---

### 2.9 — Check Sheet (Master Completion View)
> **Replaces the paper check sheet Taliya currently uses**

- [ ] Build a `ProgramChecksheet` component that renders the full curriculum as a nested checklist:
  ```
  ✅ Mathematics
     ✅ Unit 1: Fractions
        ✅ Lesson 1: Adding Fractions
        ✅ Lesson 2: Subtracting Fractions
        ⬜ Lesson 3: Mixed Numbers
     ⬜ Unit 2: Decimals
        ⬜ Lesson 1: Tenths and Hundredths
  ⬜ Reading
     ...
  ```
- [ ] Show completion date next to each completed lesson
- [ ] Color-code by status (complete = green, in progress = yellow, not started = gray)
- [ ] Add a "Print Check Sheet" / "Export PDF" button — produces a clean printout matching the format of Taliya's current paper sheets
- [ ] Accessible from both student view and parent view
- [ ] Add API route `GET /api/student/program-checksheet?studentId=&programId=` that returns the full nested structure with completion status per lesson

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

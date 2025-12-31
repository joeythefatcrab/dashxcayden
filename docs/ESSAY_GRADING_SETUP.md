# Essay Grading System Setup Guide

## Overview
The essay grading system allows students to write essays for any lesson, with automatic AI grading and parent review/approval workflow.

## Database Migration

Run the migration to create the `EssaySubmission` table:

```bash
psql "$DATABASE_URL" -f prisma/migrations/add_essay_submission.sql
```

Or if you prefer using Prisma:

```bash
npx prisma db push
```

## OpenAI Assistant Setup

### 1. Create OpenAI Assistant

1. Go to https://platform.openai.com/assistants
2. Click "Create Assistant"
3. Configure the assistant:
   - **Name**: Essay Grading Assistant
   - **Model**: gpt-4-turbo-preview (or newer)
   - **Instructions**: Copy the entire content from `/docs/essay-grading-assistant-prompt.md`
4. Save the assistant and copy the Assistant ID (format: `asst_xxxxxxxxxxxxxxxxxxxx`)

### 2. Add Environment Variables

Add to your `.env` file:

```env
OPENAI_API_KEY=sk-your-openai-api-key
ESSAY_GRADING_ASSISTANT_ID=asst_your_assistant_id
```

## How It Works

### Student Flow
1. Student clicks "Essay" button next to any lesson
2. Writes essay using rich text editor (Canvas-style)
3. Can save as draft multiple times
4. Submits essay (triggers AI grading automatically)

### AI Grading
- OpenAI Assistant analyzes essay based on student's grade level
- Provides percentage grade (0-100)
- Identifies strengths and areas for improvement
- Generates summary and parent note
- All stored in database with AI prefix (aiGrade, aiSummary, etc.)

### Parent Review
1. Parent sees notification in dashboard
2. Views essay with AI recommendation highlighted
3. Options:
   - **Approve AI Grade**: One-click approval of AI's suggested grade
   - **Manual Override**: Enter different grade and optional feedback

### Status Progression
- **DRAFT**: Student is still writing
- **SUBMITTED**: Essay submitted, awaiting parent review (AI has graded)
- **GRADED**: Parent has approved or overridden AI grade

## Backward Compatibility

Essays work with ALL curricula, even old ones without ESSAY item types:
- Essay button appears on every lesson
- Uses generic itemId: `generic-essay-{lessonId}`
- Generic prompt: "Write an essay about what you learned in: {lessonTitle}"

## Testing the System

### Test Student Essay Submission
1. Login as student
2. Go to any course → any lesson
3. Click "Essay" button
4. Write sample essay and submit
5. Check logs for AI grading activity

### Test Parent Review
1. Login as parent (or impersonate parent)
2. Go to dashboard
3. Should see pending essay in notifications
4. Click to review
5. Test both "Approve AI Grade" and manual override

## Troubleshooting

### Essay submission fails
- Check database migration ran successfully
- Verify `EssaySubmission` table exists
- Check `EssayStatus` enum exists

### AI grading not working
- Verify `OPENAI_API_KEY` is set correctly
- Verify `ESSAY_GRADING_ASSISTANT_ID` is set correctly
- Check OpenAI Assistant console for errors
- Review API usage limits

### Parent can't see essays
- Verify parent-student relationship in database
- Check parent has correct role
- Verify essay status is SUBMITTED

## API Endpoints

### Student
- `GET /api/student/essays?studentId={id}&itemId={id}` - Fetch essay
- `POST /api/student/essays` - Create/update essay (triggers AI on submit)

### Parent
- `GET /api/parent/pending-essays` - List ungraded submissions
- `POST /api/parent/grade-essay` - Approve or override AI grade

## Database Schema

```prisma
enum EssayStatus {
  DRAFT
  SUBMITTED
  GRADED
}

model EssaySubmission {
  id          String      @id @default(cuid())
  studentId   String
  lessonId    String
  itemId      String
  content     String      @db.Text
  status      EssayStatus @default(DRAFT)
  submittedAt DateTime?

  // AI Grading (automatic)
  aiGrade         Int?
  aiStrengths     String?  @db.Text
  aiImprovements  String?  @db.Text
  aiSummary       String?  @db.Text
  aiParentNote    String?  @db.Text
  aiGradedAt      DateTime?

  // Final Grading (parent)
  grade       Int?
  feedback    String?  @db.Text
  gradedAt    DateTime?
  gradedBy    String?

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@unique([studentId, itemId])
}
```

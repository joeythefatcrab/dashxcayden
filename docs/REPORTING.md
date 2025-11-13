# Progress Reporting System

## Overview

The reporting system allows parents, teachers, and administrators to export detailed progress reports in CSV format for compliance, record-keeping, and sharing with supervisors.

## Features

- **CSV Export**: Download comprehensive progress reports as CSV files
- **Flexible Filtering**: Filter by students, curricula, and date ranges
- **Role-Based Access**: Parents see only their children's data
- **Compliance Ready**: Format accepted by most school districts
- **Comprehensive Data**: Includes scores, objectives, timestamps, and more

## What's Included in Reports

Each report includes the following data points:

1. **Student Information**
   - Name
   - Grade level

2. **Course Details**
   - Curriculum name
   - Unit title
   - Lesson title

3. **Performance Data**
   - Score percentage (0-100)
   - Points earned
   - Points possible
   - Pass/Fail status
   - Passing threshold

4. **Learning Objectives**
   - State standards codes covered

5. **Timestamps**
   - Date and time of completion

## How to Use

### For Parents

1. Navigate to **Reports** in the dashboard
2. Select which students to include (or select all)
3. Optionally filter by curriculum
4. Optionally set a date range
5. Click "Download CSV Report"
6. Open in Excel, Google Sheets, or any spreadsheet app

### For Teachers/Admins

1. Navigate to **Reports** in the dashboard
2. Filter by students, curricula, or date range
3. Download CSV report for all students or filtered subset

## API Endpoint

### GET `/api/reports/progress`

Generate and download a progress report.

**Query Parameters:**

- `studentIds` (optional): Comma-separated list of student IDs
- `curriculumIds` (optional): Comma-separated list of curriculum IDs
- `startDate` (optional): ISO date string (e.g., "2024-01-01")
- `endDate` (optional): ISO date string (e.g., "2024-12-31")
- `format` (optional): "csv" (default) or "json"

**Example:**

```bash
# Download CSV for specific students in a date range
GET /api/reports/progress?studentIds=student1,student2&startDate=2024-01-01&endDate=2024-12-31&format=csv

# Download all data as JSON
GET /api/reports/progress?format=json
```

**Response:**

For CSV format:
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="progress-report-YYYY-MM-DD.csv"`
- Body: CSV file content

For JSON format:
```json
{
  "data": [
    {
      "studentName": "Emma Smith",
      "studentGrade": 8,
      "curriculum": "U.S. History: The Civil War",
      "unit": "Causes of the Civil War",
      "lesson": "Introduction to Pre-Civil War America",
      "attemptDate": "2024-11-13 14:23:45",
      "score": 85,
      "maxScore": 4,
      "earned": 3,
      "passed": true,
      "threshold": 70,
      "objectives": "8.H.1, 8.H.2"
    }
  ],
  "count": 1
}
```

## Architecture

### Components

1. **CSV Generator** (`lib/reporting/csv-generator.ts`)
   - `generateProgressReport()`: Query and transform data
   - `convertToCSV()`: Convert data to CSV format
   - `generateSummary()`: Calculate aggregate statistics
   - `escapeCSV()`: Properly escape CSV values

2. **API Route** (`app/api/reports/progress/route.ts`)
   - Role-based authorization
   - Query parameter parsing
   - Format selection (CSV/JSON)
   - File download handling

3. **Parent Reports Page** (`app/(parent)/reports/page.tsx`)
   - List available students and curricula
   - Report generation UI
   - Information about what's included

4. **Report Generator Component** (`components/reports/ReportGenerator.tsx`)
   - Student selection checkboxes
   - Curriculum filtering
   - Date range picker
   - Download button

## Database Queries

The system queries the following models:

- `Attempt`: Student assessment attempts
- `Student`: Student information
- `Lesson`: Lesson details
- `Unit`: Unit titles
- `Curriculum`: Curriculum names

Relationships are joined to provide complete data in a single query.

## Security & Access Control

### Role-Based Authorization

- **Parents**: Can only export data for their own children
- **Teachers**: Can export data for any students
- **Admins**: Can export data for any students
- **Students**: Not authorized to generate reports

### Query Filtering

Parents are automatically filtered to their children:

```typescript
if (userRole === "PARENT") {
  filters.parentId = session.user.id;
}
```

## CSV Format

The CSV file follows this structure:

```csv
Student Name,Grade,Curriculum,Unit,Lesson,Date,Score (%),Points Earned,Points Possible,Passed,Passing Threshold,Learning Objectives
Emma Smith,8,U.S. History: The Civil War,Causes of the Civil War,Introduction to Pre-Civil War America,2024-11-13 14:23:45,85,3,4,Yes,70,"8.H.1, 8.H.2"
```

### CSV Escaping

Values with commas, quotes, or newlines are properly escaped:
- Wrapped in double quotes
- Internal quotes are doubled (`"` becomes `""`)

Example:
```csv
"Smith, John",8,"History: Colonial America","Unit 1: Introduction","Lesson 1: ""The New World""",2024-11-13,85,17,20,Yes,70,"8.H.1, 8.H.2, 8.H.3"
```

## Usage Examples

### Export All Data for One Student

```typescript
const response = await fetch(
  `/api/reports/progress?studentIds=${studentId}&format=csv`
);
const blob = await response.blob();
// Download file...
```

### Export Filtered by Date Range

```typescript
const params = new URLSearchParams({
  startDate: "2024-09-01",
  endDate: "2024-12-31",
  format: "csv",
});
const response = await fetch(`/api/reports/progress?${params}`);
```

### Get Summary Statistics

```typescript
// First, fetch JSON data
const response = await fetch(`/api/reports/progress?format=json`);
const { data } = await response.json();

// Then generate summary
import { generateSummary } from "@/lib/reporting/csv-generator";
const summary = generateSummary(data);

console.log(summary);
// {
//   totalAttempts: 42,
//   totalStudents: 2,
//   averageScore: 87,
//   passRate: 95,
//   curriculumBreakdown: [...]
// }
```

## Compliance & Record-Keeping

### For Homeschool Compliance

Many states require homeschool families to maintain records of:
- Subjects studied
- Time spent on each subject
- Student progress and achievement
- State standards covered

This reporting system provides all required data in an easy-to-share format.

### Portfolio Building

Parents can:
1. Generate quarterly or annual reports
2. Include in student portfolios
3. Share with evaluators or supervisors
4. Keep for their own records

## Future Enhancements

- [ ] PDF export with formatting
- [ ] Summary statistics page
- [ ] Charts and visualizations
- [ ] Email reports automatically
- [ ] Custom report templates
- [ ] Attendance tracking
- [ ] Time-on-task metrics
- [ ] Standards alignment reports
- [ ] Multi-year historical reports
- [ ] Report scheduling (e.g., quarterly)

## Troubleshooting

### No Data in Report

If the CSV is empty:
1. Check that students have completed lessons in the selected date range
2. Verify the correct students/curricula are selected
3. Check the date range isn't too narrow

### CSV Won't Open in Excel

If the CSV has formatting issues:
1. Try opening in Google Sheets first
2. Use Excel's "Import Data" feature instead of double-clicking
3. Check for special characters in lesson titles

### Large File Downloads

For families with lots of data:
1. Use date range filters to reduce file size
2. Export one student at a time
3. Consider breaking into multiple reports (e.g., by semester)

## Support

For issues with reports:
1. Check browser console for errors
2. Verify you're logged in with correct role
3. Try with different filter combinations
4. Contact support with specific error messages

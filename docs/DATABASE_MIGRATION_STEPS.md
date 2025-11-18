# Database Migration Steps

## Overview
This document explains how to apply the admin hierarchy migration and reseed the database with test accounts.

## Changes Made
1. **Fixed Dashboard 404 Errors**: All navigation links now work correctly
2. **Added Admin Hierarchy**: Admins can now manage multiple parent accounts
3. **Updated Seed Data**: Creates realistic test data with admin, parents, and students

---

## Step 1: Apply Database Migration

The schema has been updated to add the admin-parent relationship. You need to apply these changes to your database.

### Option A: Using Prisma (Recommended)

```bash
npx prisma db push
```

This will apply the schema changes to your database.

### Option B: Manual SQL (if Prisma fails)

If Prisma has issues, you can manually apply the migration:

```bash
# Connect to your database and run:
cat prisma/migrations/add_admin_parent_hierarchy.sql | psql $DATABASE_URL
```

The migration adds:
- `adminId` field to User table
- Foreign key constraint linking parents to admins
- Index on `adminId` for performance

---

## Step 2: Generate Prisma Client

After applying the migration, regenerate the Prisma client:

```bash
npx prisma generate
```

This updates the TypeScript types to include the new fields.

---

## Step 3: Reseed the Database

Run the seed script to create test accounts:

```bash
npx prisma db seed
```

This will create:
- **1 Admin Account**: admin@homeschool.com
- **3 Parent Accounts**: parent1@, parent2@, parent3@homeschool.com
- **5 Students**: Distributed across the 3 parent accounts
- **Sample Curriculum**: U.S. History course with lessons
- **Enrollments**: Students enrolled in courses

---

## Test Accounts

After seeding, you can log in with these accounts:

| Role    | Email                    | Password    | Details          |
|---------|--------------------------|-------------|------------------|
| Admin   | admin@homeschool.com     | password123 | Manages 3 parents|
| Parent  | parent1@homeschool.com   | password123 | 2 students       |
| Parent  | parent2@homeschool.com   | password123 | 1 student        |
| Parent  | parent3@homeschool.com   | password123 | 2 students       |

---

## Verification

After migration and seed:

1. **Login as Admin**:
   - Email: admin@homeschool.com
   - Password: password123
   - Navigate to "Manage Parents" to see all 3 parent accounts

2. **Login as Parent**:
   - Email: parent1@homeschool.com
   - Password: password123
   - Navigate to "My Students" to see Emma and Noah

3. **Check Navigation**:
   - All dashboard links should work (no more 404 errors)
   - Admin sees: Dashboard, Manage Parents, Curricula, Reports, Settings
   - Parent sees: Dashboard, Curricula, My Students, Reports, Settings

---

## Hierarchy Structure

```
Admin (admin@homeschool.com)
├── Parent 1 (Sarah Smith - parent1@homeschool.com)
│   ├── Emma Smith (Grade 8)
│   └── Noah Smith (Grade 6)
├── Parent 2 (Michael Johnson - parent2@homeschool.com)
│   └── Olivia Johnson (Grade 7)
└── Parent 3 (Emily Davis - parent3@homeschool.com)
    ├── Liam Davis (Grade 5)
    └── Sophia Davis (Grade 9)
```

---

## Troubleshooting

### Prisma Engine Download Issues

If you get a "403 Forbidden" error when running Prisma commands:

```bash
# Set this environment variable
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Then retry
npx prisma db push
```

### Database Connection Issues

Make sure your `DATABASE_URL` environment variable is set correctly:

```bash
# Check current value
echo $DATABASE_URL

# Should look like:
# postgresql://user:password@localhost:5432/dbname
```

### Seed Script Fails

If the seed fails due to existing data:

```bash
# The seed script clears all data first
# Make sure you're okay with this before running
npx prisma db seed
```

---

## Next Steps

1. Apply migration
2. Regenerate Prisma client
3. Run seed script
4. Test all three account types
5. Verify navigation works correctly
6. Begin fixing other bugs in the application

All changes have been committed and pushed to the branch.

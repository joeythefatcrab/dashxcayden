# Setup Instructions

## ✅ What's Already Done

All code changes are complete and pushed to your branch! Here's what was fixed:

1. **Navigation 404 Errors** - Fixed all broken links
2. **Admin Hierarchy** - Added admin role that manages parents
3. **Database Schema** - Updated to support admin→parent→student hierarchy
4. **Seed Data** - Created test accounts (admin, 3 parents, 5 students)

---

## 🚀 Where to Run Database Commands

Since you're on an iPad, you need to run the database migration and seed commands **where your app is deployed**. Here's how:

### Option 1: Vercel (if that's your platform)

1. Go to your Vercel dashboard
2. Find your project
3. Go to **Settings** → **Environment Variables**
4. Make sure `DATABASE_URL` is set
5. Go to your **Deployment** and click the **"..."** menu
6. Select **"Redeploy"**

When it redeploys, it will automatically run `prisma generate`.

Then, to apply the migration and seed:
- Option A: Use Vercel CLI:
  ```bash
  vercel env pull
  npx prisma db push
  npx prisma db seed
  ```

- Option B: Connect to your database directly using the database provider's console (e.g., Neon, Supabase, PlanetScale) and run the SQL from `prisma/migrations/add_admin_parent_hierarchy.sql`

### Option 2: Railway / Render / Other Platform

1. Open your project dashboard
2. Find the **Terminal** or **Shell** option
3. Run these commands:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

### Option 3: Using Database GUI (Easiest!)

If your database provider has a web interface (like Neon, Supabase, PlanetScale):

1. Open the SQL editor/console
2. Copy and paste this SQL:
   ```sql
   ALTER TABLE "User" ADD COLUMN "adminId" TEXT;
   CREATE INDEX "User_adminId_idx" ON "User"("adminId");
   ALTER TABLE "User" ADD CONSTRAINT "User_adminId_fkey"
     FOREIGN KEY ("adminId") REFERENCES "User"("id")
     ON DELETE SET NULL ON UPDATE CASCADE;
   ```
3. Run it
4. Then trigger a redeploy of your app (it will regenerate Prisma client)
5. Use your platform's terminal to run: `npm run db:seed`

---

## 📧 Test Accounts (After Seeding)

Once you've run the seed script, you can log in with:

| Role     | Email                     | Password     | Notes                  |
|----------|---------------------------|--------------|------------------------|
| **Admin**| admin@homeschool.com      | password123  | Can see all parents    |
| Parent 1 | parent1@homeschool.com    | password123  | Has 2 students         |
| Parent 2 | parent2@homeschool.com    | password123  | Has 1 student          |
| Parent 3 | parent3@homeschool.com    | password123  | Has 2 students         |

---

## 🧪 Testing After Setup

1. **Log in as Admin** (admin@homeschool.com)
   - You should see "Manage Parents" in the navigation
   - Click it to see all 3 parent accounts
   - Expand each parent to see their students

2. **Log in as Parent** (parent1@homeschool.com)
   - You should see "My Students" in navigation
   - All links should work (no more 404 errors!)
   - You can see Emma and Noah

3. **Check All Navigation**
   - Dashboard ✓
   - Curricula ✓
   - Reports ✓
   - Settings ✓
   - No more 404s! ✓

---

## 🆘 If You Need Help

The changes are all committed to branch: `claude/existing-branch-work-01MMpzHo1aH27Eb6V5qe9zaB`

If you're stuck:
1. Try deploying/redeploying first (this often solves Prisma issues)
2. Check that your `DATABASE_URL` environment variable is set
3. If using a database GUI, just run the SQL migration manually
4. The seed is optional - it just creates test data

---

## 📁 Files Changed

- `components/auth/dashboard-nav.tsx` - Fixed navigation URLs
- `app/(admin)/parents/page.tsx` - Admin parent management
- `components/admin/ParentManager.tsx` - Parent list UI
- `prisma/schema.prisma` - Added admin hierarchy
- `prisma/seed.ts` - Test data with admin + parents
- `prisma/migrations/add_admin_parent_hierarchy.sql` - Migration SQL

All committed and ready to deploy! 🎉

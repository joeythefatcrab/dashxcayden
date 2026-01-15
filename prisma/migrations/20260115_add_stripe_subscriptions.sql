-- Add Stripe subscription fields to User table (for parents)
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN "stripePriceId" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeCurrentPeriodEnd" TIMESTAMP(3);

-- Add unique indexes
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- Add indexes for faster queries
CREATE INDEX "User_stripeCustomerId_idx" ON "User"("stripeCustomerId");
CREATE INDEX "User_stripeSubscriptionId_idx" ON "User"("stripeSubscriptionId");

-- Add subscription status to Student table
ALTER TABLE "Student" ADD COLUMN "subscriptionActive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Student" ADD COLUMN "subscriptionEndDate" TIMESTAMP(3);

-- Add index for subscription queries
CREATE INDEX "Student_subscriptionActive_idx" ON "Student"("subscriptionActive");

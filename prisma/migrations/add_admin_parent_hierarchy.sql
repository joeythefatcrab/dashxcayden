-- Add admin hierarchy to User table
ALTER TABLE "User" ADD COLUMN "adminId" TEXT;

-- Create index on adminId
CREATE INDEX "User_adminId_idx" ON "User"("adminId");

-- Add foreign key constraint
ALTER TABLE "User" ADD CONSTRAINT "User_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add separate verification and reimbursement status for public and personal reagents
ALTER TABLE "OrderGroup" 
ADD COLUMN "isPublicVerified" BOOLEAN DEFAULT false,
ADD COLUMN "isPublicReimbursed" BOOLEAN DEFAULT false,
ADD COLUMN "isPersonalVerified" BOOLEAN DEFAULT false,
ADD COLUMN "isPersonalReimbursed" BOOLEAN DEFAULT false;

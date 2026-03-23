-- Add separate invoice fields for public and personal reagents
ALTER TABLE "OrderGroup" ADD COLUMN "publicInvoiceNumber" TEXT;
ALTER TABLE "OrderGroup" ADD COLUMN "publicInvoiceDate" TIMESTAMP(3);
ALTER TABLE "OrderGroup" ADD COLUMN "personalInvoiceNumber" TEXT;
ALTER TABLE "OrderGroup" ADD COLUMN "personalInvoiceDate" TIMESTAMP(3);

-- AddUniqueConstraintToOrderGroup
CREATE UNIQUE INDEX "OrderGroup_userId_month_supplierName_key" 
ON "OrderGroup"("userId", "month", "supplierName");

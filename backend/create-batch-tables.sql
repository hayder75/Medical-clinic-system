-- Create BatchOrderType enum
CREATE TYPE "BatchOrderType" AS ENUM ('LAB', 'RADIOLOGY', 'MIXED');

-- Create BatchOrder table
CREATE TABLE "BatchOrder" (
    "id" SERIAL PRIMARY KEY,
    "visitId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "type" "BatchOrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'UNPAID',
    "instructions" TEXT,
    "result" TEXT,
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create BatchOrderService table
CREATE TABLE "BatchOrderService" (
    "id" SERIAL PRIMARY KEY,
    "batchOrderId" INTEGER NOT NULL,
    "serviceId" TEXT NOT NULL,
    "investigationTypeId" INTEGER,
    "instructions" TEXT,
    "result" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("batchOrderId") REFERENCES "BatchOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("investigationTypeId") REFERENCES "InvestigationType"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE("batchOrderId", "serviceId")
);

-- Add batchOrderId to File table
ALTER TABLE "File" ADD COLUMN "batchOrderId" INTEGER;
ALTER TABLE "File" ADD CONSTRAINT "File_batchOrderId_fkey" FOREIGN KEY ("batchOrderId") REFERENCES "BatchOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX "BatchOrder_visitId_idx" ON "BatchOrder"("visitId");
CREATE INDEX "BatchOrder_patientId_idx" ON "BatchOrder"("patientId");
CREATE INDEX "BatchOrder_doctorId_idx" ON "BatchOrder"("doctorId");
CREATE INDEX "BatchOrder_status_idx" ON "BatchOrder"("status");
CREATE INDEX "BatchOrder_type_idx" ON "BatchOrder"("type");
CREATE INDEX "BatchOrderService_batchOrderId_idx" ON "BatchOrderService"("batchOrderId");
CREATE INDEX "BatchOrderService_serviceId_idx" ON "BatchOrderService"("serviceId");

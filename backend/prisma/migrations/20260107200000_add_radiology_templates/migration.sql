-- CreateTable
CREATE TABLE "RadiologyTemplate" (
    "id" TEXT NOT NULL,
    "investigationTypeId" INTEGER NOT NULL,
    "findingsTemplate" TEXT,
    "conclusionTemplate" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "RadiologyTemplate_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "RadiologyResult" ADD COLUMN     "findings" TEXT,
ADD COLUMN     "conclusion" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RadiologyTemplate_investigationTypeId_key" ON "RadiologyTemplate"("investigationTypeId");

-- CreateIndex
CREATE INDEX "RadiologyTemplate_investigationTypeId_idx" ON "RadiologyTemplate"("investigationTypeId");

-- CreateIndex
CREATE INDEX "RadiologyTemplate_isActive_idx" ON "RadiologyTemplate"("isActive");

-- AddForeignKey
ALTER TABLE "RadiologyTemplate" ADD CONSTRAINT "RadiologyTemplate_investigationTypeId_fkey" FOREIGN KEY ("investigationTypeId") REFERENCES "InvestigationType"("id") ON DELETE CASCADE ON UPDATE CASCADE;


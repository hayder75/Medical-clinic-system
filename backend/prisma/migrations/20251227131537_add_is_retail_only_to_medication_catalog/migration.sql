-- AlterTable
ALTER TABLE "MedicationCatalog" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isRetailOnly" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "MedicationCatalog_isRetailOnly_idx" ON "MedicationCatalog"("isRetailOnly");

-- DropIndex
DROP INDEX "Lead_name_key";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "mergedAt" TIMESTAMP(3),
ADD COLUMN     "mergedIntoId" TEXT,
ADD COLUMN     "normalizedEmail" TEXT,
ADD COLUMN     "normalizedPhone" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "actorLabel" TEXT;

-- AlterTable
ALTER TABLE "Interaction" ADD COLUMN     "actorLabel" TEXT;

-- CreateIndex
CREATE INDEX "Lead_workspaceId_normalizedEmail_idx" ON "Lead"("workspaceId", "normalizedEmail");

-- CreateIndex
CREATE INDEX "Lead_workspaceId_normalizedPhone_idx" ON "Lead"("workspaceId", "normalizedPhone");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;


UPDATE "Lead" SET "normalizedEmail"=NULLIF(LOWER(TRIM("email")),'');
UPDATE "Lead" SET "normalizedPhone" = regexp_replace("phone", '[\s().-]', '', 'g')
WHERE regexp_replace("phone", '[\s().-]', '', 'g') ~ '^\+[1-9][0-9]{6,14}$';

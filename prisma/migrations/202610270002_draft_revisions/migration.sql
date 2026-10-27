-- AlterTable
ALTER TABLE "FollowUpDraft" ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'mock',
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "subject" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "warnings" JSONB;

-- CreateTable
CREATE TABLE "DraftRevision" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DraftRevision_draftId_revision_key" ON "DraftRevision"("draftId", "revision");

-- AddForeignKey
ALTER TABLE "DraftRevision" ADD CONSTRAINT "DraftRevision_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "FollowUpDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve a reviewable baseline for drafts created before revision tracking existed.
UPDATE "FollowUpDraft" SET "subject" = 'Follow-up' WHERE "subject" = '';
INSERT INTO "DraftRevision" ("id", "draftId", "revision", "subject", "content", "decision", "createdAt")
SELECT 'baseline-' || "id", "id", 1, "subject", "content",
       CASE WHEN "approved" THEN 'approved' WHEN "rejected" THEN 'rejected' ELSE 'generated' END,
       "createdAt"
FROM "FollowUpDraft";

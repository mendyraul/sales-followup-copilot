-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'REPLIED', 'HOT', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'FOLLOW_UP_DRAFTED', 'FOLLOW_UP_APPROVED', 'FOLLOW_UP_SENT', 'NOTE_ADDED', 'CUSTOM');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "hotLead" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "optOutReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpDraft" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "rejected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUpDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "eventType" "LeadEventType" NOT NULL DEFAULT 'CUSTOM',
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackEntry" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "rating" INTEGER NOT NULL,
    "category" TEXT,
    "comments" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "metadata" JSONB,
    "contactRequested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_name_key" ON "Lead"("name");

-- AddForeignKey
ALTER TABLE "FollowUpDraft" ADD CONSTRAINT "FollowUpDraft_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackEntry" ADD CONSTRAINT "FeedbackEntry_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;


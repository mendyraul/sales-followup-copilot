-- AlterTable
ALTER TABLE "FollowUpDraft" ADD COLUMN     "contextSnapshot" JSONB,
ADD COLUMN     "profileVersion" INTEGER;

-- CreateTable
CREATE TABLE "WritingProfile" (
    "workspaceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "tone" TEXT NOT NULL DEFAULT 'friendly',
    "signoff" TEXT NOT NULL DEFAULT 'Best,
Sales Follow-Up Copilot',
    "examples" JSONB NOT NULL DEFAULT '[]',
    "bannedPhrases" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WritingProfile_pkey" PRIMARY KEY ("workspaceId")
);

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GmailConnection" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "state" TEXT NOT NULL DEFAULT 'CONNECTED',
    "lastSyncAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorCode" TEXT,

    CONSTRAINT "GmailConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthState" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verifier" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailThread" (
    "sharedByLabel" TEXT,
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "connectionId" TEXT,
    "providerThreadId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sharedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "MailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "direction" TEXT NOT NULL,
    "interactionId" TEXT,

    CONSTRAINT "MailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GmailConnection_workspaceId_userId_key" ON "GmailConnection"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "MailThread_workspaceId_leadId_idx" ON "MailThread"("workspaceId", "leadId");

-- CreateIndex
CREATE UNIQUE INDEX "MailThread_connectionId_providerThreadId_leadId_key" ON "MailThread"("connectionId", "providerThreadId", "leadId");

-- CreateIndex
CREATE UNIQUE INDEX "MailMessage_threadId_providerMessageId_key" ON "MailMessage"("threadId", "providerMessageId");

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GmailConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailMessage" ADD CONSTRAINT "MailMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;


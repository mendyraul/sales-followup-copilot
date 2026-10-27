-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leadId" TEXT,
    "taskId" TEXT,
    "taskRevision" INTEGER,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "emailState" TEXT NOT NULL DEFAULT 'DISABLED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "leaseAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "errorCode" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digestHour" INTEGER NOT NULL DEFAULT 9,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerHeartbeat" (
    "id" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "successAt" TIMESTAMP(3),
    "errorCode" TEXT,

    CONSTRAINT "WorkerHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

-- CreateIndex
CREATE INDEX "Notification_workspaceId_userId_createdAt_idx" ON "Notification"("workspaceId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_emailState_nextAttemptAt_idx" ON "Notification"("emailState", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_workspaceId_userId_key" ON "NotificationPreference"("workspaceId", "userId");


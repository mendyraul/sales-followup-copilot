import { db } from "./db";
import { dayWindow } from "../domain/dates";
import { smtpConfigured, sendOperatorEmail } from "./mail";
import type { Notification, Prisma } from "@prisma/client";
export type Delivery = (
  to: string,
  subject: string,
  body: string,
) => Promise<void>;
export async function notify(
  input: {
    workspaceId: string;
    userId: string;
    leadId?: string;
    taskId?: string;
    taskRevision?: number;
    kind: string;
    title: string;
    dedupeKey: string;
  },
  client: Prisma.TransactionClient = db,
) {
  const preference = await client.notificationPreference.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: input.workspaceId,
        userId: input.userId,
      },
    },
  });
  return client.notification.upsert({
    where: { dedupeKey: input.dedupeKey },
    update: {},
    create: {
      ...input,
      emailState:
        preference?.emailEnabled && smtpConfigured() ? "PENDING" : "DISABLED",
    },
  });
}
export async function notificationCurrent(n: Notification, now = new Date()) {
  const member = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: n.workspaceId,
        userId: n.userId,
      },
    },
  });
  if (!member) return false;
  if (n.taskId) {
    const task = await db.followUpTask.findFirst({
      where: {
        id: n.taskId,
        revision: n.taskRevision ?? undefined,
        status: "OPEN",
        assigneeId: n.userId,
        lead: {
          workspaceId: n.workspaceId,
          unsubscribed: false,
          mergedAt: null,
          status: { notIn: ["WON", "LOST"] },
        },
      },
    });
    return !!task && task.dueAt <= now;
  }
  if (n.kind === "HANDOFF" && n.leadId)
    return !!(await db.lead.findFirst({
      where: {
        id: n.leadId,
        workspaceId: n.workspaceId,
        ownerId: n.userId,
        mergedAt: null,
      },
    }));
  if (n.kind === "DIGEST") {
    const org = await db.organization.findUnique({
      where: { id: n.workspaceId },
    });
    return (
      !!org &&
      n.dedupeKey.endsWith(
        new Intl.DateTimeFormat("en-CA", { timeZone: org.timezone }).format(
          now,
        ),
      )
    );
  }
  return true;
}
export async function deliverNotifications(
  now = new Date(),
  deliver: Delivery = sendOperatorEmail,
) {
  // A process lost during SMTP may already have delivered the message: surface it
  // for explicit review rather than blindly sending it again.
  await db.notification.updateMany({
    where: {
      emailState: "LEASED",
      leaseAt: { lt: new Date(now.getTime() - 300000) },
    },
    data: { emailState: "UNCERTAIN", errorCode: "WORKER_INTERRUPTED" },
  });
  const pending = await db.notification.findMany({
    where: {
      emailState: { in: ["PENDING", "FAILED"] },
      attempts: { lt: 5 },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  for (let offset = 0; offset < pending.length; offset += 5)
    await Promise.all(
      pending.slice(offset, offset + 5).map(async (n) => {
        const claim = await db.notification.updateMany({
          where: { id: n.id, emailState: n.emailState, attempts: n.attempts },
          data: {
            emailState: "LEASED",
            leaseAt: now,
            attempts: { increment: 1 },
          },
        });
        if (!claim.count) return;
        if (!(await notificationCurrent(n, now))) {
          await db.notification.update({
            where: { id: n.id },
            data: { emailState: "CANCELLED", errorCode: null },
          });
          return;
        }
        const preference = await db.notificationPreference.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: n.workspaceId,
              userId: n.userId,
            },
          },
        });
        if (!preference?.emailEnabled) {
          await db.notification.update({
            where: { id: n.id },
            data: { emailState: "DISABLED" },
          });
          return;
        }
        const user = await db.user.findUnique({ where: { id: n.userId } });
        if (!user) return;
        try {
          await deliver(
            user.email,
            "Follow Through: " + n.title,
            n.title +
              (n.leadId ? "\nOpen the workspace to review this lead." : ""),
          );
          await db.notification.update({
            where: { id: n.id },
            data: { emailState: "SENT", sentAt: new Date(), errorCode: null },
          });
        } catch (e) {
          const error = e as { responseCode?: number; code?: string };
          const temporary =
            !!error.responseCode &&
            error.responseCode >= 400 &&
            error.responseCode < 500;
          const definitive = !!error.responseCode;
          await db.notification.update({
            where: { id: n.id },
            data: {
              emailState: definitive ? "FAILED" : "UNCERTAIN",
              attempts: temporary ? n.attempts + 1 : 5,
              nextAttemptAt: temporary
                ? new Date(now.getTime() + Math.pow(2, n.attempts + 1) * 60000)
                : null,
              errorCode: temporary
                ? "SMTP_TEMPORARY"
                : definitive
                  ? "SMTP_REJECTED"
                  : "SMTP_DELIVERY_UNCERTAIN",
            },
          });
        }
      }),
    );
}
export async function reconcileReminders(now = new Date(), deliver?: Delivery) {
  let cursor: string | undefined;
  while (true) {
    const tasks = await db.followUpTask.findMany({
      where: {
        status: "OPEN",
        dueAt: { lte: now },
        assigneeId: { not: null },
        lead: {
          mergedAt: null,
          unsubscribed: false,
          status: { notIn: ["WON", "LOST"] },
        },
      },
      include: { lead: { select: { workspaceId: true, name: true } } },
      orderBy: { id: "asc" },
      take: 200,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    for (const task of tasks) {
      const member = await db.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: task.lead.workspaceId,
            userId: task.assigneeId!,
          },
        },
      });
      if (!member) continue;
      await notify({
        workspaceId: task.lead.workspaceId,
        userId: task.assigneeId!,
        leadId: task.leadId,
        taskId: task.id,
        taskRevision: task.revision,
        kind: "TASK_DUE",
        title: `${task.title} — ${task.lead.name}`,
        dedupeKey: `due:${task.id}:${task.revision}:${task.assigneeId}`,
      });
    }
    if (tasks.length < 200) break;
    cursor = tasks.at(-1)!.id;
  }
  const preferences = await db.notificationPreference.findMany({
    where: { digestEnabled: true },
  });
  for (const preference of preferences) {
    const member = await db.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId: preference.workspaceId,
          userId: preference.userId,
        },
      },
    });
    if (!member) continue;
    const org = await db.organization.findUnique({
      where: { id: preference.workspaceId },
    });
    if (!org) continue;
    const hour = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: org.timezone,
        hour: "2-digit",
        hourCycle: "h23",
      }).format(now),
    );
    if (hour < preference.digestHour) continue;
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: org.timezone,
    }).format(now);
    const count = await db.followUpTask.count({
      where: {
        assigneeId: preference.userId,
        status: "OPEN",
        dueAt: { lt: dayWindow(org.timezone, now).end },
        lead: {
          workspaceId: org.id,
          mergedAt: null,
          unsubscribed: false,
          status: { notIn: ["WON", "LOST"] },
        },
      },
    });
    if (count)
      await notify({
        workspaceId: org.id,
        userId: preference.userId,
        kind: "DIGEST",
        title: `${count} follow-ups need attention today`,
        dedupeKey: `digest:${org.id}:${preference.userId}:${day}`,
      });
  }
  if (smtpConfigured() || deliver) await deliverNotifications(now, deliver);
}
export async function workerStatus(client:Prisma.TransactionClient=db){const row=await client.workerHeartbeat.findUnique({where:{id:'main'}});return row?{...row,online:Date.now()-row.seenAt.getTime()<120000&&!!row.successAt&&Date.now()-row.successAt.getTime()<300000&&!row.errorCode}:null;}

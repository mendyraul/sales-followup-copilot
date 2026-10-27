import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { owner, type Access } from "./access";
import { RequestError } from "./validation";
import { identity } from "./data-management";
import { workspaceAudit } from "./followups";
import { validTimezone } from "../domain/dates";
const id = z.string().min(1).max(100),
  date = z.iso.datetime(),
  nullableDate = date.nullable();
const revision = z.object({
  id,
  draftId: id,
  revision: z.number().int().positive(),
  subject: z.string().max(300),
  content: z.string().max(15000),
  decision: z.enum(["generated", "edited", "approved", "rejected"]),
  createdAt: date,
});
const draft = z.object({
  id,
  leadId: id,
  stage: z.string().max(100),
  content: z.string().max(15000),
  subject: z.string().max(300),
  provider: z.string().max(80),
  warnings: z.unknown().nullable(),
  contextSnapshot: z.unknown().nullable().optional(),
  profileVersion: z.number().int().positive().nullable().optional(),
  revision: z.number().int().positive(),
  approved: z.boolean(),
  rejected: z.boolean(),
  createdAt: date,
  revisions: z.array(revision).max(1000),
});
const task = z.object({
  id,
  leadId: id,
  title: z.string().max(300),
  dueAt: date,
  status: z.enum(["OPEN", "COMPLETED", "CANCELLED"]),
  revision: z.number().int().positive(),
  needsReview: z.boolean(),
  createdAt: date,
  updatedAt: date,
});
const interaction = z.object({
  id,
  leadId: id,
  channel: z.enum(["CALL", "EMAIL"]),
  direction: z.enum(["INBOUND", "OUTBOUND"]),
  outcome: z.enum(["CALLED", "NO_ANSWER", "VOICEMAIL", "EMAILED", "REPLIED"]),
  occurredAt: date,
  actorLabel: z.string().nullable(),
  provenance: z.string().max(200),
  requestKey: z.string(),
  requestHash: z.string(),
  note: z.string().nullable(),
  createdAt: date,
});
const note = z.object({
  id,
  leadId: id,
  body: z.string().max(5000),
  createdAt: date,
  updatedAt: date,
});
const event = z.object({
  id,
  leadId: id,
  eventType: z.enum([
    "CREATED",
    "STATUS_CHANGED",
    "FOLLOW_UP_DRAFTED",
    "FOLLOW_UP_APPROVED",
    "FOLLOW_UP_SENT",
    "NOTE_ADDED",
    "CUSTOM",
  ]),
  payload: z.string().nullable(),
  createdAt: date,
});
const mailMessage = z.object({
  id,
  threadId: id,
  providerMessageId: z.string(),
  subject: z.string(),
  from: z.string(),
  to: z.string(),
  text: z.string().max(20000),
  occurredAt: date,
  direction: z.enum(["INBOUND", "OUTBOUND"]),
  interactionId: id.nullable(),
});
const mailThread = z.object({
  id,
  leadId: id,
  providerThreadId: z.string(),
  subject: z.string(),
  sharedByLabel: z.string().nullable(),
  createdAt: date,
  lastSyncAt: nullableDate,
  messages: z.array(mailMessage).max(10000),
});
const profileSchema = z.object({
  version: z.number().int().positive(),
  tone: z.enum(["friendly", "direct", "consultative"]),
  signoff: z.string().max(300),
  examples: z.array(z.string().max(2000)).max(5),
  bannedPhrases: z.array(z.string().max(100)).max(30),
});
const lead = z.object({
  id,
  name: z.string().min(1).max(200),
  email: z.email().nullable(),
  phone: z.string().nullable(),
  source: z.string().nullable(),
  status: z.enum(["NEW", "CONTACTED", "REPLIED", "HOT", "WON", "LOST"]),
  hotLead: z.boolean(),
  unsubscribed: z.boolean(),
  optOutReason: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: date,
  updatedAt: date,
  version: z.number().int().positive(),
  lastContactedAt: nullableDate,
  lastReplyAt: nullableDate,
  mergedAt: nullableDate,
  mergedIntoId: id.nullable(),
  ownerLabel: z.string().nullable(),
  mailThreads: z.array(mailThread).max(1000).default([]),
  tasks: z.array(task).max(10000),
  interactions: z.array(interaction).max(10000),
  drafts: z.array(draft).max(1000),
  timelineNotes: z.array(note).max(10000),
  events: z.array(event).max(10000),
});
const feedback = z.object({
  id,
  leadId: id.nullable(),
  rating: z.number().int().min(1).max(5),
  category: z.string().nullable(),
  comments: z.string().nullable(),
  channel: z.string(),
  metadata: z.unknown().nullable(),
  contactRequested: z.boolean(),
  createdAt: date,
});
const audit = z.object({
  id,
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  payload: z.string().nullable(),
  actorLabel: z.string().nullable(),
  createdAt: date,
});
export const backupSchema = z
  .object({
    version: z.literal(1),
    exportedAt: date,
    writingProfile: profileSchema.nullable().default(null),
    workspace: z.object({
      name: z.string().min(1).max(200),
      timezone: z.string().refine(validTimezone),
    }),
    leads: z.array(lead).max(10000),
    feedback: z.array(feedback).max(100000),
    audit: z.array(audit).max(100000),
  })
  .strict();
export type Backup = z.infer<typeof backupSchema>;
export async function exportWorkspace(ctx: Access) {
  owner(ctx);
  return db.$transaction(
    async (tx) => {
      const org = await tx.organization.findUniqueOrThrow({
        where: { id: ctx.workspaceId },
      });
      const users = await tx.user.findMany({
        where: { members: { some: { organizationId: ctx.workspaceId } } },
        select: { id: true, name: true },
      });
      const label = (id: string | null) =>
        id ? users.find((u) => u.id === id)?.name || "Former member" : null;
      const leads = await tx.lead.findMany({
        where: { workspaceId: ctx.workspaceId },
        include: {
          mailThreads: { include: { messages: true } },
          tasks: true,
          interactions: true,
          drafts: { include: { revisions: true } },
          timelineNotes: true,
          events: true,
        },
      });
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        writingProfile: await tx.writingProfile.findUnique({
          where: { workspaceId: ctx.workspaceId },
        }),
        workspace: { name: org.name, timezone: org.timezone },
        leads: leads.map((l) => {
          const {
            workspaceId,
            ownerId,
            normalizedEmail,
            normalizedPhone,
            ...rest
          } = l;
          void workspaceId;
          void normalizedEmail;
          void normalizedPhone;
          return {
            ...rest,
            ownerLabel: label(ownerId),
            mailThreads: l.mailThreads.map((t) => {
              const { workspaceId, connectionId, sharedBy, ...rest } = t;
              void workspaceId;
              void connectionId;
              return {
                ...rest,
                sharedByLabel: t.sharedByLabel || label(sharedBy),
              };
            }),
            tasks: l.tasks.map((t) => {
              const { assigneeId, ...rest } = t;
              void assigneeId;
              return rest;
            }),
            interactions: l.interactions.map((i) => {
              const { actorId, ...rest } = i;
              return { ...rest, actorLabel: i.actorLabel || label(actorId) };
            }),
          };
        }),
        feedback: (
          await tx.feedbackEntry.findMany({
            where: { workspaceId: ctx.workspaceId },
          })
        ).map((f) => {
          const { workspaceId, ...rest } = f;
          void workspaceId;
          return rest;
        }),
        audit: (
          await tx.auditLog.findMany({
            where: { workspaceId: ctx.workspaceId },
          })
        ).map((a) => {
          const { workspaceId, actorId, ...rest } = a;
          void workspaceId;
          return { ...rest, actorLabel: a.actorLabel || label(actorId) };
        }),
      };
      return backupSchema.parse(JSON.parse(JSON.stringify(data)));
    },
    { isolationLevel: "RepeatableRead", timeout: 30000 },
  );
}
export function validateBackup(value: unknown) {
  const backup = backupSchema.parse(value);
  const leadIds = new Set<string>();
  const allIds = new Set<string>();
  const add = (id: string) => {
    if (allIds.has(id))
      throw new RequestError("Duplicate record ID in backup.");
    allIds.add(id);
  };
  for (const l of backup.leads) {
    add(l.id);
    leadIds.add(l.id);
    if (l.tasks.filter((t) => t.status === "OPEN").length > 1)
      throw new RequestError("A contact has multiple open tasks.");
    for (const collection of [
      l.tasks,
      l.interactions,
      l.drafts,
      l.timelineNotes,
      l.events,
    ])
      for (const item of collection) {
        add(item.id);
        if (item.leadId !== l.id)
          throw new RequestError("Invalid child relationship in backup.");
      }
    for (const thread of l.mailThreads) {
      add(thread.id);
      if (thread.leadId !== l.id)
        throw new RequestError("Invalid conversation contact link.");
      const messages = new Set<string>();
      for (const message of thread.messages) {
        add(message.id);
        if (
          message.threadId !== thread.id ||
          messages.has(message.providerMessageId) ||
          (message.interactionId &&
            !l.interactions.some((i) => i.id === message.interactionId))
        )
          throw new RequestError("Invalid conversation message link.");
        messages.add(message.providerMessageId);
      }
    }
    for (const d of l.drafts) {
      const versions = new Set<number>();
      for (const r of d.revisions) {
        add(r.id);
        if (r.draftId !== d.id || versions.has(r.revision))
          throw new RequestError("Invalid draft revision history.");
        versions.add(r.revision);
      }
      if (!versions.has(d.revision))
        throw new RequestError("Current draft revision is missing.");
    }
  }
  for (const l of backup.leads)
    if (
      l.mergedIntoId &&
      (!leadIds.has(l.mergedIntoId) || l.mergedIntoId === l.id)
    )
      throw new RequestError("Invalid merged contact link.");
  for (const lead of backup.leads) {
    const seen = new Set<string>();
    let cursor: typeof lead | undefined = lead;
    while (cursor?.mergedIntoId) {
      if (seen.has(cursor.id))
        throw new RequestError("Cyclic merged contact links.");
      seen.add(cursor.id);
      const target: string = cursor.mergedIntoId;
      cursor = backup.leads.find((l) => l.id === target);
    }
  }
  for (const f of backup.feedback) {
    add(f.id);
    if (f.leadId && !leadIds.has(f.leadId))
      throw new RequestError("Invalid feedback contact link.");
  }
  for (const a of backup.audit) add(a.id);
  return {
    backup,
    digest: createHash("sha256").update(JSON.stringify(backup)).digest("hex"),
    summary: {
      name: backup.workspace.name,
      leads: backup.leads.filter((l) => !l.mergedAt).length,
      drafts: backup.leads.reduce((n, l) => n + l.drafts.length, 0),
      notes: backup.leads.reduce((n, l) => n + l.timelineNotes.length, 0),
      tasks: backup.leads.reduce((n, l) => n + l.tasks.length, 0),
      feedback: backup.feedback.length,
      audit: backup.audit.length,
    },
  };
}
export async function restoreWorkspace(
  value: unknown,
  ctx: Access,
  digest: string,
) {
  owner(ctx);
  if (!ctx.userId)
    throw new RequestError("Sign in to restore into a private workspace.", 403);
  const checked = validateBackup(value);
  if (checked.digest !== digest)
    throw new RequestError("Backup changed. Preview it again.", 409);
  const b = checked.backup;
  return db.$transaction(
    async (tx) => {
      const workspaceId = randomUUID();
      const map = new Map<string, string>();
      const remap = (old: string) => {
        if (!map.has(old)) map.set(old, randomUUID());
        return map.get(old)!;
      };
      for (const l of b.leads) remap(l.id);
      await tx.organization.create({
        data: {
          id: workspaceId,
          name: `${b.workspace.name} (restored)`,
          slug: workspaceId,
          timezone: b.workspace.timezone,
          members: {
            create: { id: randomUUID(), userId: ctx.userId!, role: "owner" },
          },
        },
      });
      for (const l of b.leads) {
        const {
          tasks,
          interactions,
          drafts,
          timelineNotes,
          events,
          ownerLabel,
          mailThreads,
          mergedIntoId,
          ...fields
        } = l;
        void ownerLabel;
        await tx.lead.create({
          data: {
            ...fields,
            ...identity(fields),
            id: remap(l.id),
            workspaceId,
            ownerId: null,
            mergedIntoId: null,
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
            lastContactedAt: l.lastContactedAt
              ? new Date(l.lastContactedAt)
              : null,
            lastReplyAt: l.lastReplyAt ? new Date(l.lastReplyAt) : null,
            mergedAt: l.mergedAt ? new Date(l.mergedAt) : null,
          },
        });
        void mergedIntoId;
        for (const t of tasks)
          await tx.followUpTask.create({
            data: {
              ...t,
              id: remap(t.id),
              leadId: remap(l.id),
              assigneeId: null,
              dueAt: new Date(t.dueAt),
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
            },
          });
        for (const i of interactions) {
          const { actorLabel, ...rest } = i;
          await tx.interaction.create({
            data: {
              ...rest,
              id: remap(i.id),
              leadId: remap(l.id),
              actorId: null,
              actorLabel,
              provenance: `restored:${i.provenance}`.slice(0, 200),
              occurredAt: new Date(i.occurredAt),
              createdAt: new Date(i.createdAt),
            },
          });
        }
        for (const d of drafts) {
          const { revisions, warnings, contextSnapshot, ...rest } = d;
          await tx.followUpDraft.create({
            data: {
              ...rest,
              contextSnapshot:
                contextSnapshot == null
                  ? Prisma.JsonNull
                  : (contextSnapshot as Prisma.InputJsonValue),
              id: remap(d.id),
              leadId: remap(l.id),
              warnings:
                warnings === null
                  ? Prisma.JsonNull
                  : (warnings as Prisma.InputJsonValue),
              createdAt: new Date(d.createdAt),
            },
          });
          for (const r of revisions)
            await tx.draftRevision.create({
              data: {
                ...r,
                id: remap(r.id),
                draftId: remap(d.id),
                createdAt: new Date(r.createdAt),
              },
            });
        }
        for (const thread of mailThreads) {
          const { messages, sharedByLabel, ...rest } = thread;
          await tx.mailThread.create({
            data: {
              ...rest,
              id: remap(thread.id),
              workspaceId,
              leadId: remap(l.id),
              connectionId: null,
              sharedBy: null,
              sharedByLabel,
              createdAt: new Date(thread.createdAt),
              lastSyncAt: thread.lastSyncAt
                ? new Date(thread.lastSyncAt)
                : null,
            },
          });
          for (const m of messages)
            await tx.mailMessage.create({
              data: {
                ...m,
                id: remap(m.id),
                threadId: remap(thread.id),
                interactionId: m.interactionId ? remap(m.interactionId) : null,
                occurredAt: new Date(m.occurredAt),
              },
            });
        }
        for (const n of timelineNotes)
          await tx.leadNote.create({
            data: {
              ...n,
              id: remap(n.id),
              leadId: remap(l.id),
              createdAt: new Date(n.createdAt),
              updatedAt: new Date(n.updatedAt),
            },
          });
        for (const e of events)
          await tx.leadEvent.create({
            data: {
              ...e,
              id: remap(e.id),
              leadId: remap(l.id),
              createdAt: new Date(e.createdAt),
            },
          });
      }
      if (b.writingProfile)
        await tx.writingProfile.create({
          data: { ...b.writingProfile, workspaceId },
        });
      for (const l of b.leads)
        if (l.mergedIntoId)
          await tx.lead.update({
            where: { id: remap(l.id) },
            data: { mergedIntoId: remap(l.mergedIntoId) },
          });
      for (const f of b.feedback) {
        const { metadata, ...rest } = f;
        await tx.feedbackEntry.create({
          data: {
            ...rest,
            id: remap(f.id),
            workspaceId,
            leadId: f.leadId ? remap(f.leadId) : null,
            metadata:
              metadata === null
                ? Prisma.JsonNull
                : (metadata as Prisma.InputJsonValue),
            createdAt: new Date(f.createdAt),
          },
        });
      }
      for (const a of b.audit)
        await tx.auditLog.create({
          data: {
            ...a,
            id: remap(a.id),
            workspaceId,
            actorId: null,
            entityId: a.entityId ? map.get(a.entityId) || a.entityId : null,
            createdAt: new Date(a.createdAt),
          },
        });
      await workspaceAudit(
        tx,
        { ...ctx, workspaceId },
        "workspace.restored",
        workspaceId,
        { sourceExportedAt: b.exportedAt, records: checked.summary },
        "workspace",
      );
      return { workspaceId };
    },
    { timeout: 60000, isolationLevel: "Serializable" },
  );
}

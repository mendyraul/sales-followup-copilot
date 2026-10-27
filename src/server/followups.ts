import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { Access } from "./access";
import { db } from "./db";
import { object, RequestError, text } from "./validation";
import { localDueAt, snoozedDueAt } from "../domain/dates";
export async function workspaceAudit(
  tx: Prisma.TransactionClient,
  ctx: Access,
  action: string,
  entityId: string,
  payload: unknown,
  entityType = "lead",
) {
  await tx.auditLog.create({
    data: {
      workspaceId: ctx.workspaceId,
      actorId: ctx.userId,
      action,
      entityType,
      entityId,
      payload: JSON.stringify(payload),
    },
  });
}
export async function scopedLead(
  tx: Prisma.TransactionClient,
  ctx: Access,
  id: string,
) {
  const lead = await tx.lead.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (!lead) throw new RequestError("Lead not found.", 404);
  return lead;
}
export function expectedRevision(value: unknown, current: number) {
  if (Number(value) !== current || !Number.isInteger(Number(value)))
    throw new RequestError("This record changed. Refresh and retry.", 409);
}
async function due(input: Record<string, unknown>, timezone: string) {
  try {
    if (input.snoozeDays !== undefined) {
      const days = Number(input.snoozeDays);
      if (![1, 7].includes(days)) throw new Error();
      return snoozedDueAt(days, timezone);
    }
    const result = input.localDueAt
      ? localDueAt(text(input.localDueAt, "Due date", 40), timezone)
      : new Date(text(input.dueAt, "Due date", 50));
    if (!Number.isFinite(result.getTime())) throw new Error();
    return result;
  } catch {
    throw new RequestError(
      "Enter a valid due date. Ambiguous or missing daylight-saving times need another time.",
    );
  }
}
export async function followupCommand(
  input: Record<string, unknown>,
  ctx: Access,
) {
  const action = text(input.action, "Action", 40);
  const id = text(input.leadId, "Lead", 100);
  return db.$transaction(
    async (tx) => {
      const lead = await scopedLead(tx, ctx, id);
      const org = await tx.organization.findUniqueOrThrow({
        where: { id: ctx.workspaceId },
      });
      if (action === "logInteraction") {
        const outcome = text(input.outcome, "Outcome", 30);
        if (
          !["CALLED", "NO_ANSWER", "VOICEMAIL", "EMAILED", "REPLIED"].includes(
            outcome,
          )
        )
          throw new RequestError("Invalid interaction outcome.");
        const occurredAt = input.occurredAt
          ? new Date(text(input.occurredAt, "Interaction date", 50))
          : new Date();
        if (
          !Number.isFinite(occurredAt.getTime()) ||
          occurredAt.getTime() > Date.now() + 300000
        )
          throw new RequestError("Interaction date cannot be in the future.");
        const requestKey = text(input.requestKey, "Request key", 100);
        const note = text(input.note, "Note", 5000, true);
        const hash = createHash("sha256")
          .update(
            JSON.stringify({
              outcome,
              note,
              occurredAt: input.occurredAt || null,
              localDueAt: input.localDueAt || null,
              nextAction: input.nextAction || null,
            }),
          )
          .digest("hex");
        const previous = await tx.interaction.findUnique({
          where: { leadId_requestKey: { leadId: id, requestKey } },
        });
        if (previous) {
          if (previous.requestHash !== hash)
            throw new RequestError(
              "Request key was already used for a different interaction.",
              409,
            );
          return { id: previous.id };
        }
        const inbound = outcome === "REPLIED";
        const record = await tx.interaction.create({
          data: {
            leadId: id,
            outcome,
            channel: ["EMAILED", "REPLIED"].includes(outcome)
              ? "EMAIL"
              : "CALL",
            direction: inbound ? "INBOUND" : "OUTBOUND",
            occurredAt,
            actorId: ctx.userId,
            requestKey,
            requestHash: hash,
            note: note || null,
          },
        });
        if (note)
          await tx.leadNote.create({ data: { leadId: id, body: note } });
        await tx.lead.update({
          where: { id },
          data: {
            version: { increment: 1 },
            lastContactedAt:
              !inbound &&
              (!lead.lastContactedAt || occurredAt > lead.lastContactedAt)
                ? occurredAt
                : lead.lastContactedAt,
            lastReplyAt:
              inbound && (!lead.lastReplyAt || occurredAt > lead.lastReplyAt)
                ? occurredAt
                : lead.lastReplyAt,
          },
        });
        await tx.leadEvent.create({
          data: {
            leadId: id,
            eventType: "CUSTOM",
            payload: JSON.stringify({
              outcome,
              occurredAt,
              interactionId: record.id,
            }),
          },
        });
        if (input.localDueAt || input.dueAt) {
          if (lead.unsubscribed || ["WON", "LOST"].includes(lead.status))
            throw new RequestError(
              "Cannot schedule follow-up for a closed or opted-out lead.",
              409,
            );
          await tx.followUpTask.updateMany({
            where: { leadId: id, status: "OPEN" },
            data: { status: "COMPLETED", revision: { increment: 1 } },
          });
          await tx.followUpTask.create({
            data: {
              leadId: id,
              title: text(input.nextAction, "Next action", 300),
              dueAt: await due(input, org.timezone),
              assigneeId: lead.ownerId,
            },
          });
        } else if (inbound)
          await tx.followUpTask.updateMany({
            where: { leadId: id, status: "OPEN" },
            data: { needsReview: true, revision: { increment: 1 } },
          });
        await workspaceAudit(tx, ctx, "interaction.logged", id, {
          interactionId: record.id,
          outcome,
          occurredAt,
        });
        return { id: record.id };
      }
      if (action === "scheduleTask") {
        if (lead.unsubscribed || ["WON", "LOST"].includes(lead.status))
          throw new RequestError(
            "Cannot schedule for a closed or opted-out lead.",
            409,
          );
        const existing = await tx.followUpTask.findFirst({
          where: { leadId: id, status: "OPEN" },
        });
        if (existing)
          throw new RequestError(
            "This lead already has a next action. Reschedule or complete it first.",
            409,
          );
        const task = await tx.followUpTask.create({
          data: {
            leadId: id,
            title: text(input.title, "Next action", 300),
            dueAt: await due(input, org.timezone),
            assigneeId: lead.ownerId,
          },
        });
        await workspaceAudit(tx, ctx, "task.scheduled", id, {
          taskId: task.id,
          dueAt: task.dueAt,
        });
        return { id: task.id };
      }
      const taskId = text(input.taskId, "Task", 100);
      const task = await tx.followUpTask.findFirst({
        where: { id: taskId, leadId: id, status: "OPEN" },
      });
      if (!task) throw new RequestError("Open task not found.", 404);
      expectedRevision(input.revision, task.revision);
      if (action === "rescheduleTask") {
        await tx.followUpTask.update({
          where: { id: taskId },
          data: {
            dueAt: await due(input, org.timezone),
            title: input.title
              ? text(input.title, "Next action", 300)
              : task.title,
            revision: { increment: 1 },
            needsReview: false,
          },
        });
      } else if (action === "completeTask" || action === "cancelTask") {
        await tx.followUpTask.update({
          where: { id: taskId },
          data: {
            status: action === "completeTask" ? "COMPLETED" : "CANCELLED",
            revision: { increment: 1 },
          },
        });
      } else throw new RequestError("Unknown follow-up action.");
      await workspaceAudit(tx, ctx, `task.${action}`, id, { taskId });
      return { id: taskId };
    },
    { isolationLevel: "Serializable" },
  );
}

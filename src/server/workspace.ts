import {workerStatus} from "./reminders";
import { teamCommand } from "./team";
import { smtpConfigured } from "./mail";
import { dataCommand } from "./data-management";
import { expectedRevision } from "./followups";
import { followupCommand } from "./followups";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import type { Access } from "./access";
import { bool, leadFields, object, RequestError, text } from "./validation";
import { canTransition, type LeadStatus as DomainStatus } from "../domain/lead";
import { generateFirstFollowupDraft } from "../../lib/firstFollowupDraft";

export async function snapshot(ctx: Access) {
  return db.$transaction(
    async (tx) => ({
      leads: await tx.lead.findMany({
        where: { workspaceId: ctx.workspaceId, mergedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          tasks: { orderBy: { createdAt: "desc" } },
          interactions: { orderBy: { occurredAt: "desc" } },
          drafts: {
            orderBy: { createdAt: "desc" },
            include: { revisions: { orderBy: { revision: "desc" } } },
          },
          timelineNotes: { orderBy: { createdAt: "desc" } },
          events: { orderBy: { createdAt: "desc" } },
        },
      }),
      audit: await tx.auditLog.findMany({
        where: { workspaceId: ctx.workspaceId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      feedback: await tx.feedbackEntry.findMany({
        where: { workspaceId: ctx.workspaceId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      members: await tx.member.findMany({
        where: { organizationId: ctx.workspaceId },
        select: {
          id: true,
          userId: true,
          role: true,
          user: { select: { name: true, email: true } },
        },
      }),
      notifications: ctx.userId
        ? await tx.notification.findMany({
            where: { workspaceId: ctx.workspaceId, userId: ctx.userId },
            orderBy: { createdAt: "desc" },
            take: 100,
          })
        : [],
      preferences: ctx.userId
        ? await tx.notificationPreference.findUnique({
            where: {
              workspaceId_userId: {
                workspaceId: ctx.workspaceId,
                userId: ctx.userId,
              },
            },
          })
        : null,
      capabilities: { smtp: smtpConfigured() },
      worker: await workerStatus(tx),
      settings: await tx.organization.findUnique({
        where: { id: ctx.workspaceId },
        select: { timezone: true, name: true },
      }),
      workspace: {
        id: ctx.workspaceId,
        role: ctx.role,
        userId: ctx.userId,
        demo: ctx.demo,
      },
      mode: {
        sending: "disabled",
        provider: process.env.AI_PROVIDER || "mock",
      },
    }),
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
}

function audit(
  tx: Prisma.TransactionClient,
  ctx: Access,
  action: string,
  entityType: string,
  entityId: string,
  payload: unknown,
) {
  return tx.auditLog.create({
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
async function requireLead(
  tx: Prisma.TransactionClient,
  ctx: Access,
  id: string,
) {
  const lead = await tx.lead.findFirst({
    where: { id, workspaceId: ctx.workspaceId },
  });
  if (lead?.mergedAt)
    throw new RequestError(
      "Contact was merged. Resolve its current ID first.",
      409,
    );
  if (!lead)
    throw new RequestError("Lead not found. Refresh the workspace.", 404);
  return lead;
}
async function event(
  tx: Prisma.TransactionClient,
  leadId: string,
  eventType:
    | "CREATED"
    | "STATUS_CHANGED"
    | "NOTE_ADDED"
    | "FOLLOW_UP_DRAFTED"
    | "FOLLOW_UP_APPROVED"
    | "CUSTOM",
  payload: unknown,
) {
  await tx.leadEvent.create({
    data: { leadId, eventType, payload: JSON.stringify(payload) },
  });
}
export async function command(value: unknown, ctx: Access) {
  const input = object(value);
  const action = text(input.action, "Action", 40);
  if (
    [
      "logInteraction",
      "scheduleTask",
      "rescheduleTask",
      "completeTask",
      "cancelTask",
    ].includes(action)
  )
    return followupCommand(input, ctx);
  if (
    [
      "previewImport",
      "importCsv",
      "duplicateCandidates",
      "mergeLeads",
    ].includes(action)
  )
    return dataCommand(input, ctx);
  if (
    [
      "saveWorkspaceSettings",
      "saveNotificationPreferences",
      "markNotificationRead",
      "retryNotificationEmail",
      "assignLead",
    ].includes(action)
  )
    return teamCommand(input, ctx);
  if (action === "createLead") {
    const fields = leadFields(input);
    return db.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          ...fields,
          workspaceId: ctx.workspaceId,
          hotLead: fields.status === "HOT",
          ownerId: ctx.userId,
        },
      });
      await event(tx, lead.id, "CREATED", { name: lead.name });
      await audit(tx, ctx, "lead.created", "lead", lead.id, fields);
      return { id: lead.id };
    });
  }
  if (action === "feedback") {
    if (process.env.FEEDBACK_CAPTURE_ENABLED === "false")
      throw new RequestError("Feedback capture is disabled.", 403);
    if (
      !Number.isInteger(input.rating) ||
      Number(input.rating) < 1 ||
      Number(input.rating) > 5
    )
      throw new RequestError("Rating must be an integer from 1 to 5.");
    const leadId = text(input.leadId, "Lead", 100, true) || null;
    const data = {
      workspaceId: ctx.workspaceId,
      rating: Number(input.rating),
      leadId,
      category: text(input.category, "Category", 80, true),
      comments: text(input.comments, "Feedback", 3000),
      channel: text(
        process.env.FEEDBACK_DEFAULT_CHANNEL || "in_app",
        "Feedback channel",
        80,
      ),
      contactRequested:
        input.contactRequested === undefined
          ? false
          : bool(input.contactRequested, "Contact requested"),
    };
    return db.$transaction(async (tx) => {
      if (leadId) await requireLead(tx, ctx, leadId);
      const feedback = await tx.feedbackEntry.create({ data });
      await audit(tx, ctx, "feedback.created", "feedback", feedback.id, data);
      return { id: feedback.id };
    });
  }
  const id = text(input.leadId, "Lead", 100);
  if (action === "generateDraft") {
    const lead = await db.lead.findFirst({
      where: { id, workspaceId: ctx.workspaceId },
      include: { timelineNotes: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!lead) throw new RequestError("Lead not found.", 404);
    if (lead.unsubscribed || ["WON", "LOST"].includes(lead.status))
      throw new RequestError(
        "Drafts are unavailable for opted-out or closed leads.",
        409,
      );
    const result = await generateFirstFollowupDraft(
      {
        leadName: lead.name,
        recentContext: lead.timelineNotes[0]?.body || lead.notes || undefined,
        leadSource: lead.source || undefined,
        desiredNextStep:
          text(input.objective, "Next step", 500, true) || undefined,
      },
      {
        provider: process.env.AI_PROVIDER || "mock",
        apiKey: process.env.AI_API_KEY,
        model: process.env.AI_MODEL,
      },
    );
    return db.$transaction(async (tx) => {
      const current = await requireLead(tx, ctx, id);
      if (current.version !== lead.version)
        throw new RequestError(
          "Lead changed while generating. Please try again.",
          409,
        );
      const draft = await tx.followUpDraft.create({
        data: {
          leadId: id,
          stage: "first-followup",
          subject: result.subject,
          content: result.body,
          provider: result.provider,
          warnings: result.warnings,
          revisions: {
            create: {
              revision: 1,
              subject: result.subject,
              content: result.body,
              decision: "generated",
            },
          },
        },
      });
      await event(tx, id, "FOLLOW_UP_DRAFTED", {
        draftId: draft.id,
        provider: result.provider,
      });
      await audit(tx, ctx, "draft.generated", "draft", draft.id, {
        leadId: id,
        provider: result.provider,
      });
      return { id: draft.id };
    });
  }
  return db.$transaction(
    async (tx) => {
      const lead = await requireLead(tx, ctx, id);
      if (action === "updateLead") {
        const fields = leadFields(input);
        if (
          fields.status !== lead.status &&
          !canTransition(
            lead.status.toLowerCase() as DomainStatus,
            fields.status.toLowerCase() as DomainStatus,
          )
        )
          throw new RequestError(
            `Cannot move ${lead.status} to ${fields.status}.`,
            409,
          );
        expectedRevision(input.version, lead.version);
        await tx.lead.update({
          where: { id },
          data: {
            version: { increment: 1 },
            ...fields,
            workspaceId: ctx.workspaceId,
            hotLead: fields.status === "HOT",
          },
        });
        if (fields.unsubscribed || ["WON", "LOST"].includes(fields.status))
          await tx.followUpTask.updateMany({
            where: { leadId: id, status: "OPEN" },
            data: { status: "CANCELLED", revision: { increment: 1 } },
          });
        await event(
          tx,
          id,
          fields.status !== lead.status ? "STATUS_CHANGED" : "CUSTOM",
          { from: lead.status, to: fields.status, summary: "Lead updated" },
        );
        await audit(tx, ctx, "lead.updated", "lead", id, {
          before: lead,
          after: fields,
        });
      } else if (action === "deleteLead") {
        expectedRevision(input.version, lead.version);
        await audit(tx, ctx, "lead.deleted", "lead", id, lead);
        await tx.lead.delete({ where: { id } });
      } else if (action === "addNote") {
        const body = text(input.body, "Note", 5000);
        await tx.leadNote.create({ data: { leadId: id, body } });
        await tx.lead.update({
          where: { id },
          data: { version: { increment: 1 } },
        });
        await event(tx, id, "NOTE_ADDED", { body });
        await audit(tx, ctx, "note.created", "lead", id, { body });
      } else if (action === "reviewDraft") {
        const draftId = text(input.draftId, "Draft", 100);
        const decision = text(input.decision, "Decision", 20);
        if (!["edited", "approved", "rejected"].includes(decision))
          throw new RequestError("Invalid review decision.");
        const draft = await tx.followUpDraft.findFirst({
          where: { id: draftId, leadId: id },
        });
        if (!draft) throw new RequestError("Draft not found.", 404);
        if (
          decision === "approved" &&
          (lead.unsubscribed || ["WON", "LOST"].includes(lead.status))
        )
          throw new RequestError(
            "Cannot approve for an opted-out or closed lead.",
            409,
          );
        if (
          !Number.isInteger(input.revision) ||
          input.revision !== draft.revision
        )
          throw new RequestError(
            "This draft changed. Refresh before reviewing again.",
            409,
          );
        const subject = text(input.subject, "Subject", 300);
        const content = text(input.content, "Draft body", 15000);
        const updated = await tx.followUpDraft.updateMany({
          where: { id: draftId, revision: draft.revision },
          data: {
            subject,
            content,
            approved: decision === "approved",
            rejected: decision === "rejected",
            revision: { increment: 1 },
          },
        });
        if (!updated.count)
          throw new RequestError(
            "This draft changed. Refresh before reviewing again.",
            409,
          );
        await tx.draftRevision.create({
          data: {
            draftId,
            revision: draft.revision + 1,
            subject,
            content,
            decision,
          },
        });
        await event(
          tx,
          id,
          decision === "approved" ? "FOLLOW_UP_APPROVED" : "CUSTOM",
          { draftId, decision },
        );
        await audit(tx, ctx, `draft.${decision}`, "draft", draftId, {
          leadId: id,
          revision: draft.revision + 1,
          sending: "disabled",
        });
      } else {
        throw new RequestError("Unknown action.");
      }
      return { id };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

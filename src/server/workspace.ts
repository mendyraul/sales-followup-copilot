import { Prisma } from "@prisma/client";
import { db } from "./db";
import { bool, leadFields, object, RequestError, text } from "./validation";
import { canTransition, type LeadStatus as DomainStatus } from "../domain/lead";
import { parseLeadCsvPreview } from "../domain/csv-import";
import { generateFirstFollowupDraft } from "../../lib/firstFollowupDraft";

export async function snapshot() {
  return db.$transaction(
    async (tx) => ({
      leads: await tx.lead.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          drafts: {
            orderBy: { createdAt: "desc" },
            include: { revisions: { orderBy: { revision: "desc" } } },
          },
          timelineNotes: { orderBy: { createdAt: "desc" } },
          events: { orderBy: { createdAt: "desc" } },
        },
      }),
      audit: await tx.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      feedback: await tx.feedbackEntry.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
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
  action: string,
  entityType: string,
  entityId: string,
  payload: unknown,
) {
  return tx.auditLog.create({
    data: { action, entityType, entityId, payload: JSON.stringify(payload) },
  });
}
async function requireLead(tx: Prisma.TransactionClient, id: string) {
  const lead = await tx.lead.findUnique({ where: { id } });
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
export async function command(value: unknown) {
  const input = object(value);
  const action = text(input.action, "Action", 40);
  if (action === "createLead") {
    const fields = leadFields(input);
    return db.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: { ...fields, hotLead: fields.status === "HOT" },
      });
      await event(tx, lead.id, "CREATED", { name: lead.name });
      await audit(tx, "lead.created", "lead", lead.id, fields);
      return { id: lead.id };
    });
  }
  if (action === "importCsv") {
    const preview = parseLeadCsvPreview(text(input.csv, "CSV", 80000));
    if (
      preview.missingHeaders.length ||
      preview.unknownHeaders.length ||
      preview.issues.length ||
      preview.duplicateEmails.length ||
      !preview.validRows.length ||
      preview.validRows.length > 200
    ) {
      throw new RequestError(
        "Import requires 1–200 valid rows, name and email headers, accepted columns, and no duplicate emails. Fix the preview errors first.",
      );
    }
    return db.$transaction(async (tx) => {
      for (const row of preview.validRows) {
        const fields = leadFields({ ...row, status: row.status.toUpperCase() });
        if (await tx.lead.findFirst({ where: { email: fields.email } }))
          throw new RequestError(`Email already exists: ${row.email}`, 409);
        const lead = await tx.lead.create({
          data: { ...fields, hotLead: fields.status === "HOT" },
        });
        await event(tx, lead.id, "CREATED", { source: "csv" });
        await audit(tx, "lead.imported", "lead", lead.id, fields);
      }
      return { imported: preview.validRows.length };
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
      if (leadId) await requireLead(tx, leadId);
      const feedback = await tx.feedbackEntry.create({ data });
      await audit(tx, "feedback.created", "feedback", feedback.id, data);
      return { id: feedback.id };
    });
  }
  const id = text(input.leadId, "Lead", 100);
  if (action === "generateDraft") {
    const lead = await db.lead.findUnique({
      where: { id },
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
      const current = await requireLead(tx, id);
      if (current.updatedAt.getTime() !== lead.updatedAt.getTime())
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
      await audit(tx, "draft.generated", "draft", draft.id, {
        leadId: id,
        provider: result.provider,
      });
      return { id: draft.id };
    });
  }
  return db.$transaction(
    async (tx) => {
      const lead = await requireLead(tx, id);
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
        await tx.lead.update({
          where: { id },
          data: { ...fields, hotLead: fields.status === "HOT" },
        });
        await event(
          tx,
          id,
          fields.status !== lead.status ? "STATUS_CHANGED" : "CUSTOM",
          { from: lead.status, to: fields.status, summary: "Lead updated" },
        );
        await audit(tx, "lead.updated", "lead", id, {
          before: lead,
          after: fields,
        });
      } else if (action === "deleteLead") {
        await audit(tx, "lead.deleted", "lead", id, lead);
        await tx.lead.delete({ where: { id } });
      } else if (action === "addNote") {
        const body = text(input.body, "Note", 5000);
        await tx.leadNote.create({ data: { leadId: id, body } });
        await tx.lead.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
        await event(tx, id, "NOTE_ADDED", { body });
        await audit(tx, "note.created", "lead", id, { body });
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
        await audit(tx, `draft.${decision}`, "draft", draftId, {
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

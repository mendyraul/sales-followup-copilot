import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { owner, type Access } from "./access";
import { expectedRevision, scopedLead, workspaceAudit } from "./followups";
import { leadFields, object, RequestError, text } from "./validation";
import { normalizedEmail, normalizedPhone } from "../domain/contacts";
import { parseLeadCsvPreview } from "../domain/csv-import";
export const identity = (fields: {
  email?: string | null;
  phone?: string | null;
}) => ({
  normalizedEmail: normalizedEmail(fields.email),
  normalizedPhone: normalizedPhone(fields.phone),
});
async function candidates(
  tx: Prisma.TransactionClient,
  ctx: Access,
  fields: { email?: string | null; phone?: string | null; name: string },
) {
  const { normalizedEmail: email, normalizedPhone: phone } = identity(fields);
  return tx.lead.findMany({
    where: {
      workspaceId: ctx.workspaceId,
      mergedAt: null,
      OR: [
        ...(email ? [{ normalizedEmail: email }] : []),
        ...(phone ? [{ normalizedPhone: phone }] : []),
        { name: { equals: fields.name, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      source: true,
      status: true,
      notes: true,
      unsubscribed: true,
      version: true,
    },
  });
}
export async function mergeLeads(
  tx: Prisma.TransactionClient,
  ctx: Access,
  input: Record<string, unknown>,
) {
  const source = await scopedLead(tx, ctx, text(input.sourceId, "Source", 100));
  const target = await scopedLead(tx, ctx, text(input.targetId, "Target", 100));
  if (source.id === target.id || source.mergedAt || target.mergedAt)
    throw new RequestError("Choose two separate active contacts.", 409);
  expectedRevision(input.sourceVersion, source.version);
  expectedRevision(input.targetVersion, target.version);
  const fields = leadFields(object(input.fields));
  fields.unsubscribed ||= source.unsubscribed || target.unsubscribed;
  const sourceTask = await tx.followUpTask.findFirst({
    where: { leadId: source.id, status: "OPEN" },
  });
  const targetTask = await tx.followUpTask.findFirst({
    where: { leadId: target.id, status: "OPEN" },
  });
  if (sourceTask && targetTask) {
    if (!["source", "target"].includes(String(input.keepTask)))
      throw new RequestError("Choose which open next action to keep.");
    await tx.followUpTask.update({
      where: {
        id: input.keepTask === "source" ? targetTask.id : sourceTask.id,
      },
      data: { status: "CANCELLED", revision: { increment: 1 } },
    });
  }
  // Interaction request keys are per contact; prefix moved keys to preserve identities.
  const interactions = await tx.interaction.findMany({
    where: { leadId: source.id },
  });
  for (const i of interactions)
    await tx.interaction.update({
      where: { id: i.id },
      data: { leadId: target.id, requestKey: `merged:${i.id}` },
    });
  await tx.followUpTask.updateMany({
    where: { leadId: source.id },
    data: {
      leadId: target.id,
      assigneeId: target.ownerId,
      revision: { increment: 1 },
    },
  });
  await tx.followUpDraft.updateMany({
    where: { leadId: source.id },
    data: { leadId: target.id },
  });
  await tx.leadNote.updateMany({
    where: { leadId: source.id },
    data: { leadId: target.id },
  });
  await tx.leadEvent.updateMany({
    where: { leadId: source.id },
    data: { leadId: target.id },
  });
  await tx.feedbackEntry.updateMany({
    where: { leadId: source.id, workspaceId: ctx.workspaceId },
    data: { leadId: target.id },
  });
  const latest = (a: Date | null, b: Date | null) =>
    a && b ? (a > b ? a : b) : a || b;
  await tx.lead.update({
    where: { id: target.id },
    data: {
      ...fields,
      ...identity(fields),
      hotLead: fields.status === "HOT",
      version: { increment: 1 },
      lastContactedAt: latest(source.lastContactedAt, target.lastContactedAt),
      lastReplyAt: latest(source.lastReplyAt, target.lastReplyAt),
    },
  });
  await tx.lead.update({
    where: { id: source.id },
    data: {
      mergedAt: new Date(),
      mergedIntoId: target.id,
      version: { increment: 1 },
    },
  });
  await tx.lead.updateMany({
    where: { workspaceId: ctx.workspaceId, mergedIntoId: source.id },
    data: { mergedIntoId: target.id },
  });
  if (fields.unsubscribed || ["WON", "LOST"].includes(fields.status))
    await tx.followUpTask.updateMany({
      where: { leadId: target.id, status: "OPEN" },
      data: { status: "CANCELLED", revision: { increment: 1 } },
    });
  await workspaceAudit(tx, ctx, "lead.merged", target.id, {
    sourceId: source.id,
    fields,
    keepTask: input.keepTask || null,
  });
  return { id: target.id };
}
function parseCsv(input: Record<string, unknown>) {
  const csv = text(input.csv, "CSV", 80000);
  const preview = parseLeadCsvPreview(csv);
  if (
    preview.missingHeaders.length ||
    preview.unknownHeaders.length ||
    preview.issues.length ||
    preview.duplicateEmails.length ||
    !preview.validRows.length ||
    preview.validRows.length > 200
  )
    throw new RequestError(
      "Import requires 1–200 valid rows with no duplicate emails or invalid headers.",
    );
  return { csv, preview };
}
export async function previewImport(
  input: Record<string, unknown>,
  ctx: Access,
) {
  const { csv, preview } = parseCsv(input);
  return db.$transaction(async (tx) => ({
    digest: createHash("sha256").update(csv).digest("hex"),
    rows: await Promise.all(
      preview.validRows.map(async (row) => ({
        row,
        fields: leadFields({ ...row, status: row.status.toUpperCase() }),
        candidates: await candidates(tx, ctx, row),
      })),
    ),
  }));
}
export async function importCsv(input: Record<string, unknown>, ctx: Access) {
  const { csv, preview } = parseCsv(input);
  if (
    input.digest &&
    input.digest !== createHash("sha256").update(csv).digest("hex")
  )
    throw new RequestError("CSV changed; preview it again.", 409);
  const decisions = Array.isArray(input.decisions)
    ? input.decisions.map(object)
    : [];
  return db.$transaction(
    async (tx) => {
      let imported = 0;
      for (const row of preview.validRows) {
        const fields = leadFields({ ...row, status: row.status.toUpperCase() });
        const found = await candidates(tx, ctx, fields);
        const decision = decisions.find(
          (d) => Number(d.rowNumber) === row.rowNumber,
        );
        if (found.length && !decision)
          throw new RequestError(
            `Review possible duplicate on row ${row.rowNumber}.`,
            409,
          );
        if (decision?.action === "skip") continue;
        if (decision?.action === "merge") {
          const target = found.find((c) => c.id === decision.targetId);
          if (!target)
            throw new RequestError("Import match changed. Preview again.", 409);
          expectedRevision(decision.targetVersion, target.version);
          const chosen = leadFields(object(decision.fields));
          await tx.lead.update({
            where: { id: target.id },
            data: {
              ...chosen,
              ...identity(chosen),
              hotLead: chosen.status === "HOT",
              version: { increment: 1 },
            },
          });
          await workspaceAudit(tx, ctx, "lead.import.updated", target.id, {
            row: row.rowNumber,
            fields: chosen,
          });
        } else {
          if (decision && decision.action !== "create")
            throw new RequestError("Invalid import decision.");
          const lead = await tx.lead.create({
            data: {
              ...fields,
              ...identity(fields),
              workspaceId: ctx.workspaceId,
              ownerId: ctx.userId,
              hotLead: fields.status === "HOT",
            },
          });
          await tx.leadEvent.create({
            data: {
              leadId: lead.id,
              eventType: "CREATED",
              payload: JSON.stringify({ source: "csv" }),
            },
          });
          await workspaceAudit(tx, ctx, "lead.imported", lead.id, fields);
        }
        imported++;
      }
      return { imported };
    },
    { isolationLevel: "Serializable" },
  );
}
export async function dataCommand(input: Record<string, unknown>, ctx: Access) {
  if (input.action === "previewImport") return previewImport(input, ctx);
  if (input.action === "importCsv") return importCsv(input, ctx);
  if (input.action === "duplicateCandidates") {
    const lead = await db.lead.findFirst({
      where: {
        id: text(input.leadId, "Lead", 100),
        workspaceId: ctx.workspaceId,
        mergedAt: null,
      },
    });
    if (!lead) throw new RequestError("Lead not found.", 404);
    return {
      candidates: (
        await db.$transaction((tx) => candidates(tx, ctx, lead))
      ).filter((c) => c.id !== lead.id),
    };
  }
  if (input.action === "mergeLeads")
    return db.$transaction((tx) => mergeLeads(tx, ctx, input), {
      isolationLevel: "Serializable",
    });
  throw new RequestError("Unknown data action.");
}

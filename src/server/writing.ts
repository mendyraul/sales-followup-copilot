import { Prisma } from "@prisma/client";
import { db } from "./db";
import { owner, type Access } from "./access";
import { bool, object, RequestError, text } from "./validation";
import { scopedLead, workspaceAudit } from "./followups";
import { generateFirstFollowupDraft } from "../../lib/firstFollowupDraft";
const stringList = (value: unknown, max: number, length: number) => {
  if (!Array.isArray(value) || value.length > max)
    throw new RequestError(
      `Expected up to ${max} writing examples or phrases.`,
    );
  return value.map((v) => text(v, "Writing reference", length));
};
export async function saveWritingProfile(
  input: Record<string, unknown>,
  ctx: Access,
) {
  owner(ctx);
  const tone = text(input.tone, "Tone", 30);
  if (!["friendly", "direct", "consultative"].includes(tone))
    throw new RequestError("Invalid tone.");
  const data = {
    tone,
    signoff: text(input.signoff, "Sign-off", 300),
    examples: stringList(input.examples, 5, 2000),
    bannedPhrases: stringList(input.bannedPhrases, 30, 100),
  };
  return db.$transaction(
    async (tx) => {
      const old = await tx.writingProfile.findUnique({
        where: { workspaceId: ctx.workspaceId },
      });
      if (Number(input.version) !== (old?.version ?? 0))
        throw new RequestError(
          "Writing profile changed. Refresh and retry.",
          409,
        );
      const profile = await tx.writingProfile.upsert({
        where: { workspaceId: ctx.workspaceId },
        update: { ...data, version: { increment: 1 } },
        create: { workspaceId: ctx.workspaceId, ...data },
      });
      await workspaceAudit(
        tx,
        ctx,
        "writing.profile.updated",
        ctx.workspaceId,
        { version: profile.version },
        "workspace",
      );
      return { id: ctx.workspaceId };
    },
    { isolationLevel: "Serializable" },
  );
}
async function reserveAi(ctx: Access) {
  const day = new Date().toISOString().slice(0, 10);
  const limits = [
    {
      id: `workspace:${ctx.workspaceId}:${day}`,
      max: Number(process.env.AI_DAILY_REQUEST_LIMIT || 20),
    },
    {
      id: `instance:${day}`,
      max: Number(process.env.AI_INSTANCE_DAILY_LIMIT || 100),
    },
  ];
  await db.$transaction(
    async (tx) => {
      for (const budget of limits) {
        if (!Number.isInteger(budget.max) || budget.max < 1)
          throw new RequestError("AI usage is disabled by the operator.", 503);
        const usage = await tx.aiUsage.upsert({
          where: { id: budget.id },
          create: { id: budget.id, count: 0 },
          update: {},
        });
        if (usage.count >= budget.max)
          throw new RequestError(
            "The configured AI request allowance is exhausted. Use template drafts or try tomorrow.",
            429,
          );
        await tx.aiUsage.update({
          where: { id: budget.id },
          data: { count: { increment: 1 } },
        });
      }
    },
    { isolationLevel: "Serializable" },
  );
}
export async function generateSavedDraft(
  input: Record<string, unknown>,
  ctx: Access,
) {
  const id = text(input.leadId, "Lead", 100);
  const lead = await db.lead.findFirst({
    where: { id, workspaceId: ctx.workspaceId, mergedAt: null },
    include: { timelineNotes: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!lead) throw new RequestError("Lead not found.", 404);
  if (lead.unsubscribed || ["WON", "LOST"].includes(lead.status))
    throw new RequestError(
      "Drafts unavailable for closed or opted-out contacts.",
      409,
    );
  const selectedIds =
    input.noteIds === undefined
      ? lead.timelineNotes.slice(0, 1).map((n) => n.id)
      : stringList(input.noteIds, 5, 100);
  const notes = await db.leadNote.findMany({
    where: { id: { in: selectedIds }, leadId: id },
  });
  if (notes.length !== new Set(selectedIds).size)
    throw new RequestError(
      "A selected note is unavailable. Refresh and retry.",
      409,
    );
  const mailIds =
    input.messageIds === undefined ? [] : stringList(input.messageIds, 5, 100);
  const messages = await db.mailMessage.findMany({
    where: {
      id: { in: mailIds },
      thread: { workspaceId: ctx.workspaceId, leadId: id },
    },
  });
  if (messages.length !== new Set(mailIds).size)
    throw new RequestError("A selected conversation is unavailable.", 409);
  const profile = await db.writingProfile.findUnique({
    where: { workspaceId: ctx.workspaceId },
  });
  const refs = [
    ...(lead.notes
      ? [{ type: "lead", id: lead.id, excerpt: lead.notes.slice(0, 3000) }]
      : []),
    ...notes.map((n) => ({
      type: "note",
      id: n.id,
      excerpt: n.body.slice(0, 1500),
    })),
    ...messages.map((m) => ({
      type: "mail",
      id: m.id,
      excerpt: m.text.slice(0, 1500),
    })),
  ];
  const provider = process.env.AI_PROVIDER || "mock";
  const external = provider === "openai";
  if (external) {
    if (input.confirmExternal !== true)
      throw new RequestError(
        "Confirm sharing the selected context with the configured AI provider.",
      );
    await reserveAi(ctx);
  }
  const voice = profile
    ? {
        signoff: profile.signoff,
        examples: profile.examples as string[],
        bannedPhrases: profile.bannedPhrases as string[],
      }
    : undefined;
  const result = await generateFirstFollowupDraft(
    {
      leadName: lead.name,
      recentContext:
        refs
          .map((r) => r.excerpt)
          .join("\n")
          .slice(0, 12000) || undefined,
      leadSource: lead.source || undefined,
      desiredNextStep:
        text(input.objective, "Next step", 500, true) || undefined,
      tone: profile?.tone as "friendly" | "direct" | "consultative" | undefined,
      writingProfile: voice,
    },
    { provider, apiKey: process.env.AI_API_KEY, model: process.env.AI_MODEL },
  );
  return db.$transaction(
    async (tx) => {
      const current = await scopedLead(tx, ctx, id);
      if (current.version !== lead.version)
        throw new RequestError(
          "Lead changed while generating. Review the context and try again.",
          409,
        );
      const currentProfile = await tx.writingProfile.findUnique({
        where: { workspaceId: ctx.workspaceId },
      });
      if ((currentProfile?.version ?? null) !== (profile?.version ?? null))
        throw new RequestError(
          "Writing profile changed while generating. Please try again.",
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
          profileVersion: profile?.version ?? null,
          contextSnapshot: { sources: refs, profile: voice ?? null, external },
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
      await tx.leadEvent.create({
        data: {
          leadId: id,
          eventType: "FOLLOW_UP_DRAFTED",
          payload: JSON.stringify({
            draftId: draft.id,
            provider: result.provider,
          }),
        },
      });
      await workspaceAudit(
        tx,
        ctx,
        "draft.generated",
        draft.id,
        {
          leadId: id,
          provider: result.provider,
          profileVersion: profile?.version ?? null,
          sources: refs.map((r) => ({ id: r.id, type: r.type })),
        },
        "draft",
      );
      return { id: draft.id };
    },
    { isolationLevel: "Serializable" },
  );
}

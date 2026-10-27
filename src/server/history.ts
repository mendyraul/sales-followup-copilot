import { db } from "./db";
import { type Access } from "./access";
import { RequestError, text } from "./validation";
export async function history(ctx: Access, params: URLSearchParams) {
  const kind = params.get("kind") || "audit";
  const cursor = params.get("cursor") || undefined;
  const take = 50;
  const where = { workspaceId: ctx.workspaceId };
  if (kind === "audit" || kind === "feedback" || kind === "notifications") {
    const notificationWhere = { ...where, userId: ctx.userId || "none" };
    if (cursor) {
      const existing =
        kind === "audit"
          ? await db.auditLog.findFirst({ where: { id: cursor, ...where } })
          : kind === "feedback"
            ? await db.feedbackEntry.findFirst({
                where: { id: cursor, ...where },
              })
            : await db.notification.findFirst({
                where: { id: cursor, ...notificationWhere },
              });
      if (!existing) throw new RequestError("Invalid history cursor.");
    }
    const args = {
      orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    };
    const rows =
      kind === "audit"
        ? await db.auditLog.findMany({ ...args, where })
        : kind === "feedback"
          ? await db.feedbackEntry.findMany({ ...args, where })
          : await db.notification.findMany({
              ...args,
              where: notificationWhere,
            });
    return {
      items: rows.slice(0, take),
      nextCursor: rows.length > take ? rows[take - 1].id : null,
    };
  }
  const leadId = text(params.get("leadId"), "Lead", 100);
  const lead = await db.lead.findFirst({
    where: { id: leadId, workspaceId: ctx.workspaceId, mergedAt: null },
    select: { id: true },
  });
  if (!lead) throw new RequestError("Lead not found.", 404);
  if (kind === "notes") {
    if (
      cursor &&
      !(await db.leadNote.findFirst({ where: { id: cursor, leadId } }))
    )
      throw new RequestError("Invalid note cursor.");
    const rows = await db.leadNote.findMany({
      where: { leadId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return {
      items: rows.slice(0, take),
      nextCursor: rows.length > take ? rows[take - 1].id : null,
    };
  }
  if (kind === "events") {
    if (
      cursor &&
      !(await db.leadEvent.findFirst({ where: { id: cursor, leadId } }))
    )
      throw new RequestError("Invalid event cursor.");
    const rows = await db.leadEvent.findMany({
      where: { leadId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return {
      items: rows.slice(0, take),
      nextCursor: rows.length > take ? rows[take - 1].id : null,
    };
  }
  throw new RequestError("Invalid history type.");
}

import { db } from "./db";
import { owner, type Access } from "./access";
import { bool, RequestError, text } from "./validation";
import { expectedRevision, scopedLead, workspaceAudit } from "./followups";
import { validTimezone } from "../domain/dates";
import { notify } from "./reminders";
export async function teamCommand(input: Record<string, unknown>, ctx: Access) {
  if (input.action === "saveWorkspaceSettings") {
    owner(ctx);
    const name = text(input.name, "Workspace name", 200);
    const timezone = text(input.timezone, "Timezone", 100);
    if (!validTimezone(timezone))
      throw new RequestError(
        "Use a valid IANA timezone, e.g. America/New_York.",
      );
    return db.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: ctx.workspaceId },
        data: { name, timezone },
      });
      await workspaceAudit(
        tx,
        ctx,
        "workspace.settings.updated",
        ctx.workspaceId,
        { name, timezone },
        "workspace",
      );
      return { id: ctx.workspaceId };
    });
  }
  if (input.action === "saveNotificationPreferences") {
    if (!ctx.userId)
      throw new RequestError("Sign in to configure reminders.", 403);
    const digestHour = Number(input.digestHour);
    if (!Number.isInteger(digestHour) || digestHour < 0 || digestHour > 23)
      throw new RequestError("Digest hour must be 0–23.");
    const data = {
      emailEnabled: bool(input.emailEnabled, "Email reminders"),
      digestEnabled: bool(input.digestEnabled, "Daily digest"),
      digestHour,
    };
    await db.notificationPreference.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
        },
      },
      update: data,
      create: { ...data, workspaceId: ctx.workspaceId, userId: ctx.userId },
    });
    return { id: ctx.userId };
  }
  if (
    input.action === "markNotificationRead" ||
    input.action === "retryNotificationEmail"
  ) {
    if (!ctx.userId) throw new RequestError("Sign in first.", 401);
    const id = text(input.notificationId, "Notification", 100);
    const notification = await db.notification.findFirst({
      where: { id, workspaceId: ctx.workspaceId, userId: ctx.userId },
    });
    if (!notification) throw new RequestError("Notification not found.", 404);
    if (input.action === "markNotificationRead")
      await db.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });
    else {
      if (!["FAILED", "UNCERTAIN"].includes(notification.emailState))
        throw new RequestError("This email is not retryable.", 409);
      await db.notification.update({
        where: { id },
        data: {
          emailState: "PENDING",
          attempts: 0,
          nextAttemptAt: null,
          leaseAt: null,
        },
      });
    }
    return { id };
  }
  if (input.action === "assignLead") {
    const id = text(input.leadId, "Lead", 100);
    const assignee = text(input.ownerId, "Owner", 100, true) || null;
    if (
      assignee &&
      !(await db.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: ctx.workspaceId,
            userId: assignee,
          },
        },
      }))
    )
      throw new RequestError("Choose a current workspace member.");
    const result = await db.$transaction(
      async (tx) => {
        const lead = await scopedLead(tx, ctx, id);
        expectedRevision(input.version, lead.version);
        await tx.lead.update({
          where: { id },
          data: { ownerId: assignee, version: { increment: 1 } },
        });
        await tx.followUpTask.updateMany({
          where: { leadId: id, status: "OPEN" },
          data: { assigneeId: assignee, revision: { increment: 1 } },
        });
        await workspaceAudit(tx, ctx, "lead.assigned", id, {
          from: lead.ownerId,
          to: assignee,
        });
        if (assignee)
          await notify(
            {
              workspaceId: ctx.workspaceId,
              userId: assignee,
              leadId: id,
              kind: "HANDOFF",
              title: `${lead.name} was assigned to you`,
              dedupeKey: `handoff:${id}:${lead.version + 1}:${assignee}`,
            },
            tx,
          );
        return { id };
      },
      { isolationLevel: "Serializable" },
    );
    return { id };
  }
  throw new RequestError("Unknown team action.");
}
export async function unassignRemovedMember(
  workspaceId: string,
  userId: string,
) {
  await db.$transaction(async (tx) => {
    await tx.gmailConnection.deleteMany({ where: { workspaceId, userId } });
    await tx.oAuthState.deleteMany({ where: { workspaceId, userId } });
    await tx.notificationPreference.deleteMany({
      where: { workspaceId, userId },
    });
    const leads = await tx.lead.findMany({
      where: { workspaceId, ownerId: userId },
      select: { id: true },
    });
    await tx.lead.updateMany({
      where: { workspaceId, ownerId: userId },
      data: { ownerId: null, version: { increment: 1 } },
    });
    await tx.followUpTask.updateMany({
      where: { leadId: { in: leads.map((l) => l.id) }, status: "OPEN" },
      data: { assigneeId: null, revision: { increment: 1 } },
    });
    await tx.notification.updateMany({
      where: { workspaceId, userId, emailState: { in: ["PENDING", "FAILED"] } },
      data: { emailState: "CANCELLED" },
    });
    await tx.auditLog.create({
      data: {
        workspaceId,
        action: "member.work.unassigned",
        entityType: "member",
        entityId: userId,
        payload: JSON.stringify({ leads: leads.map((l) => l.id) }),
      },
    });
  });
}

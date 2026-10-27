import { db } from "./db";
import type { Access } from "./access";
export async function onboardingCommand(action: string, ctx: Access) {
  await db.onboardingState.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: ctx.workspaceId,
        userId: ctx.userId || "demo",
      },
    },
    update: { dismissedAt: action === "dismissOnboarding" ? new Date() : null },
    create: {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId || "demo",
      dismissedAt: action === "dismissOnboarding" ? new Date() : null,
    },
  });
  return { id: ctx.workspaceId };
}

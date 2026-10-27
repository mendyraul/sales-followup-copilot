import type { NextRequest } from "next/server";
import { getAuth } from "./auth";
import { db } from "./db";
import { isDemo, appUrl } from "./config";
import { RequestError } from "./validation";
export type Access = {
  workspaceId: string;
  userId: string | null;
  role: string;
  demo: boolean;
};
export function checkOrigin(request: NextRequest) {
  const expected = new URL(appUrl());
  const host = request.headers.get("host")?.toLowerCase();
  if (isDemo()) {
    let parsed: URL;
    try {
      parsed = new URL(`http://${host}`);
    } catch {
      throw new RequestError("Invalid local Host.", 403);
    }
    if (!["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname))
      throw new RequestError("Demo access is local only.", 403);
    const origin = request.headers.get("origin");
    if (origin) {
      let url: URL;
      try {
        url = new URL(origin);
      } catch {
        throw new RequestError("Invalid origin.", 403);
      }
      if (url.host.toLowerCase() !== host || url.protocol !== "http:")
        throw new RequestError("Cross-origin changes are blocked.", 403);
    }
  } else {
    if (host !== expected.host.toLowerCase())
      throw new RequestError("Unexpected request host.", 403);
    const origin = request.headers.get("origin");
    if (origin && origin !== expected.origin)
      throw new RequestError("Cross-origin changes are blocked.", 403);
  }
}
export async function access(request: NextRequest): Promise<Access> {
  checkOrigin(request);
  if (isDemo())
    return { workspaceId: "legacy", userId: null, role: "owner", demo: true };
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) throw new RequestError("Sign in to continue.", 401);
  const requested =
    request.headers.get("x-workspace-id") ||
    session.session.activeOrganizationId;
  const member = await db.member.findFirst({
    where: {
      userId: session.user.id,
      ...(requested ? { organizationId: requested } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  if (!member) throw new RequestError("Workspace membership is required.", 403);
  return {
    workspaceId: member.organizationId,
    userId: session.user.id,
    role: member.role,
    demo: false,
  };
}
export function owner(ctx: Access) {
  if (ctx.role !== "owner")
    throw new RequestError("Workspace owner access required.", 403);
}

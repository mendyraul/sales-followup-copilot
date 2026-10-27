import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { appUrl } from "./config";
import { type Access } from "./access";
import { object, RequestError, text } from "./validation";
import { seal, unseal } from "./secrets";
import { parseGmailMessage, header, type GmailMessage } from "../domain/gmail";
import { workspaceAudit } from "./followups";
import type { GmailConnection } from "@prisma/client";
const scope = "https://www.googleapis.com/auth/gmail.readonly";
const context = (c: { workspaceId: string; userId: string }) =>
  `gmail:${c.workspaceId}:${c.userId}`;
export const gmailEnabled = () =>
  process.env.GMAIL_ENABLED === "true" &&
  !!process.env.GOOGLE_CLIENT_ID &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  /^[a-f0-9]{64}$/i.test(process.env.TOKEN_ENCRYPTION_KEY || "");
type Fetch = typeof fetch;
class GmailError extends Error {
  constructor(
    public code: string,
    public reconnect = false,
  ) {
    super(code);
  }
}
async function providerJson(response: Response) {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403)
      throw new GmailError("GMAIL_AUTH_REQUIRED", true);
    throw new GmailError(
      response.status === 429 ? "GMAIL_RATE_LIMITED" : "GMAIL_UNAVAILABLE",
    );
  }
  return response.json();
}
async function connection(ctx: Access) {
  if (!ctx.userId) throw new RequestError("Sign in to connect an inbox.", 403);
  const c = await db.gmailConnection.findUnique({
    where: {
      workspaceId_userId: { workspaceId: ctx.workspaceId, userId: ctx.userId },
    },
  });
  if (!c) throw new RequestError("Connect Gmail first.", 409);
  return c;
}
export async function gmailStatus(ctx: Access) {
  if (!ctx.userId) return null;
  return db.gmailConnection.findUnique({
    where: {
      workspaceId_userId: { workspaceId: ctx.workspaceId, userId: ctx.userId },
    },
    select: {
      id: true,
      email: true,
      state: true,
      lastSyncAt: true,
      errorCode: true,
    },
  });
}
export async function beginGmail(ctx: Access) {
  if (!gmailEnabled() || !ctx.userId)
    throw new RequestError("Gmail is not enabled by the operator.", 503);
  const state = randomBytes(32).toString("base64url"),
    verifier = randomBytes(32).toString("base64url");
  await db.oAuthState.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await db.oAuthState.create({
    data: {
      id: createHash("sha256").update(state).digest("hex"),
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      verifier: seal(
        verifier,
        context({ workspaceId: ctx.workspaceId, userId: ctx.userId }),
      ),
      expiresAt: new Date(Date.now() + 600000),
    },
  });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: appUrl() + "/api/inbox/callback",
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  }).toString();
  return { url: url.toString() };
}
export async function completeGmail(
  ctx: Access,
  state: string,
  code: string,
  fetcher: Fetch = fetch,
) {
  if (!gmailEnabled() || !ctx.userId)
    throw new RequestError("Gmail is not enabled.", 503);
  const stateId = createHash("sha256").update(state).digest("hex");
  const row = await db.oAuthState.findUnique({ where: { id: stateId } });
  if (
    !row ||
    row.userId !== ctx.userId ||
    row.workspaceId !== ctx.workspaceId ||
    row.expiresAt < new Date()
  )
    throw new RequestError(
      "Gmail sign-in expired or belonged to another workspace. Start again.",
      403,
    );
  const claimed = await db.oAuthState.deleteMany({
    where: { id: stateId, userId: ctx.userId, workspaceId: ctx.workspaceId },
  });
  if (!claimed.count)
    throw new RequestError("Gmail sign-in was already used.", 409);
  const token = await providerJson(
    await fetcher("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        code_verifier: unseal(row.verifier, context(row)),
        grant_type: "authorization_code",
        redirect_uri: appUrl() + "/api/inbox/callback",
      }),
      signal: AbortSignal.timeout(20000),
    }),
  );
  if (!token.access_token || !token.refresh_token)
    throw new RequestError(
      "Google did not issue offline access. Reconnect with consent.",
      409,
    );
  const profile = await providerJson(
    await fetcher("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${token.access_token}` },
      signal: AbortSignal.timeout(15000),
    }),
  );
  const email = text(profile.emailAddress, "Gmail address", 254);
  const credentials = {
    email,
    refreshToken: seal(token.refresh_token, context(row)),
    accessToken: seal(token.access_token, context(row)),
    expiresAt: new Date(Date.now() + Number(token.expires_in || 3600) * 1000),
    state: "CONNECTED",
    errorCode: null,
    nextSyncAt: new Date(),
  };
  const prior = await db.gmailConnection.findUnique({
    where: {
      workspaceId_userId: { workspaceId: ctx.workspaceId, userId: ctx.userId },
    },
  });
  if (prior && prior.email !== email)
    throw new RequestError(
      "Disconnect the previous inbox before changing addresses.",
      409,
    );
  await db.gmailConnection.upsert({
    where: {
      workspaceId_userId: { workspaceId: ctx.workspaceId, userId: ctx.userId },
    },
    update: credentials,
    create: {
      ...credentials,
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
    },
  });
  return { connected: true };
}
async function accessToken(c: GmailConnection, fetcher: Fetch) {
  if (
    c.accessToken &&
    c.expiresAt &&
    c.expiresAt.getTime() > Date.now() + 120000
  )
    return unseal(c.accessToken, context(c));
  const response = await fetcher("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: unseal(c.refreshToken, context(c)),
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (response.status === 400 || response.status === 401)
    throw new GmailError("GMAIL_RECONNECT_REQUIRED", true);
  const token = await providerJson(response);
  if (!token.access_token) throw new GmailError("GMAIL_INVALID_TOKEN", true);
  await db.gmailConnection.updateMany({
    where: { id: c.id },
    data: {
      accessToken: seal(token.access_token, context(c)),
      expiresAt: new Date(Date.now() + Number(token.expires_in || 3600) * 1000),
      ...(token.refresh_token
        ? { refreshToken: seal(token.refresh_token, context(c)) }
        : {}),
    },
  });
  return String(token.access_token);
}
async function gmailGet(c: GmailConnection, path: string, fetcher: Fetch) {
  let token = await accessToken(c, fetcher);
  let response = await fetcher(
    "https://gmail.googleapis.com/gmail/v1/users/me/" + path,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(20000),
    },
  );
  if (response.status === 401) {
    token = await accessToken({ ...c, accessToken: null }, fetcher);
    response = await fetcher(
      "https://gmail.googleapis.com/gmail/v1/users/me/" + path,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(20000),
      },
    );
  }
  return providerJson(response);
}
export async function syncGmailConnection(id: string, fetcher: Fetch = fetch) {
  const c = await db.gmailConnection.findUnique({ where: { id } });
  if (!c) return;
  const member = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: c.workspaceId,
        userId: c.userId,
      },
    },
  });
  if (!member) {
    await db.gmailConnection.updateMany({
      where: { id },
      data: { state: "RECONNECT_REQUIRED", errorCode: "MEMBERSHIP_REMOVED" },
    });
    return;
  }
  try {
    const threads = await db.mailThread.findMany({
      where: { connectionId: id, workspaceId: c.workspaceId },
    });
    for (const thread of threads) {
      const result = await gmailGet(
        c,
        "threads/" +
          encodeURIComponent(thread.providerThreadId) +
          "?format=full",
        fetcher,
      );
      const messages = (result.messages || []) as GmailMessage[];
      await db.$transaction(
        async (tx) => {
          const linked = await tx.mailThread.findFirst({
            where: {
              id: thread.id,
              connectionId: id,
              workspaceId: c.workspaceId,
            },
          });
          const lead = await tx.lead.findFirst({
            where: {
              id: thread.leadId,
              workspaceId: c.workspaceId,
              mergedAt: null,
            },
          });
          if (!linked || !lead) return;
          let lastContact = lead.lastContactedAt,
            lastReply = lead.lastReplyAt;
          for (const raw of messages) {
            const parsed = parseGmailMessage(raw);
            const existing = await tx.mailMessage.findUnique({
              where: {
                threadId_providerMessageId: {
                  threadId: thread.id,
                  providerMessageId: raw.id,
                },
              },
            });
            if (existing) continue;
            let interactionId: string | null = null;
            if (!parsed.automatic) {
              const key =
                "gmail:" +
                createHash("sha256")
                  .update(c.email.toLowerCase())
                  .digest("hex")
                  .slice(0, 16) +
                ":" +
                raw.id;
              const previous = await tx.interaction.findUnique({
                where: {
                  leadId_requestKey: { leadId: lead.id, requestKey: key },
                },
              });
              const interaction =
                previous ||
                (await tx.interaction.create({
                  data: {
                    leadId: lead.id,
                    channel: "EMAIL",
                    direction: parsed.direction,
                    outcome:
                      parsed.direction === "OUTBOUND" ? "EMAILED" : "REPLIED",
                    occurredAt: parsed.occurredAt,
                    actorId: c.userId,
                    provenance: "gmail",
                    requestKey: key,
                    requestHash: createHash("sha256")
                      .update(raw.id)
                      .digest("hex"),
                  },
                }));
              interactionId = interaction.id;
              if (
                parsed.direction === "OUTBOUND" &&
                (!lastContact || parsed.occurredAt > lastContact)
              )
                lastContact = parsed.occurredAt;
              if (
                parsed.direction === "INBOUND" &&
                (!lastReply || parsed.occurredAt > lastReply)
              ) {
                lastReply = parsed.occurredAt;
                await tx.followUpTask.updateMany({
                  where: {
                    leadId: lead.id,
                    status: "OPEN",
                    needsReview: false,
                    createdAt: { lte: parsed.occurredAt },
                  },
                  data: { needsReview: true, revision: { increment: 1 } },
                });
              }
            }
            await tx.mailMessage.create({
              data: {
                threadId: thread.id,
                providerMessageId: raw.id,
                subject: parsed.subject,
                from: parsed.from,
                to: parsed.to,
                text: parsed.text,
                occurredAt: parsed.occurredAt,
                direction: parsed.direction,
                interactionId,
              },
            });
          }
          if (
            lastContact?.getTime() !== lead.lastContactedAt?.getTime() ||
            lastReply?.getTime() !== lead.lastReplyAt?.getTime()
          )
            await tx.lead.update({
              where: { id: lead.id },
              data: {
                lastContactedAt: lastContact,
                lastReplyAt: lastReply,
                version: { increment: 1 },
              },
            });
          await tx.mailThread.update({
            where: { id: thread.id },
            data: { lastSyncAt: new Date() },
          });
        },
        { timeout: 30000, isolationLevel: "Serializable" },
      );
    }
    await db.gmailConnection.updateMany({
      where: { id },
      data: {
        state: "CONNECTED",
        lastSyncAt: new Date(),
        nextSyncAt: new Date(Date.now() + 300000),
        errorCode: null,
      },
    });
  } catch (error) {
    const e =
      error instanceof GmailError ? error : new GmailError("GMAIL_SYNC_FAILED");
    await db.gmailConnection.updateMany({
      where: { id },
      data: {
        state: e.reconnect ? "RECONNECT_REQUIRED" : "ERROR",
        errorCode: e.code,
        nextSyncAt: new Date(Date.now() + 300000),
      },
    });
    throw new RequestError(
      e.reconnect
        ? "Gmail access needs to be reconnected."
        : "Gmail sync failed. It will retry; check the connection status.",
      503,
    );
  }
}
export async function syncDueGmail() {
  if (!gmailEnabled()) return;
  const connections = await db.gmailConnection.findMany({
    where: {
      state: { in: ["CONNECTED", "ERROR"] },
      nextSyncAt: { lte: new Date() },
    },
    take: 20,
    orderBy: { nextSyncAt: "asc" },
  });
  for (const c of connections)
    try {
      await syncGmailConnection(c.id);
    } catch {
      /* Individual connection status is visible to its owner. */
    }
}
export async function gmailCommand(
  input: Record<string, unknown>,
  ctx: Access,
  fetcher: Fetch = fetch,
) {
  if (input.action === "status")
    return { enabled: gmailEnabled(), connection: await gmailStatus(ctx) };
  if (!gmailEnabled())
    throw new RequestError("Gmail is not enabled by the operator.", 503);
  if (input.action === "connect") return beginGmail(ctx);
  const c = await connection(ctx);
  if (input.action === "disconnect") {
    let revoked = true;
    try {
      const r = await fetcher("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: unseal(c.refreshToken, context(c)),
        }),
        signal: AbortSignal.timeout(10000),
      });
      revoked = r.ok;
    } catch {
      revoked = false;
    }
    if (input.removeImported === true) {
      const threads = await db.mailThread.findMany({
        where: { connectionId: c.id, workspaceId: ctx.workspaceId },
        include: { messages: { select: { interactionId: true } } },
      });
      await db.$transaction(async (tx) => {
        const ids = threads.flatMap((t) =>
          t.messages
            .map((m) => m.interactionId)
            .filter((v): v is string => !!v),
        );
        await tx.mailThread.deleteMany({
          where: {
            id: { in: threads.map((t) => t.id) },
            workspaceId: ctx.workspaceId,
          },
        });
        for (const id of ids)
          if (
            !(await tx.mailMessage.findFirst({ where: { interactionId: id } }))
          )
            await tx.interaction.deleteMany({
              where: {
                id,
                lead: { workspaceId: ctx.workspaceId },
                provenance: "gmail",
              },
            });
        for (const leadId of new Set(threads.map((t) => t.leadId))) {
          const lastOut = await tx.interaction.aggregate({
            where: { leadId, direction: "OUTBOUND" },
            _max: { occurredAt: true },
          });
          const lastIn = await tx.interaction.aggregate({
            where: { leadId, direction: "INBOUND" },
            _max: { occurredAt: true },
          });
          await tx.lead.updateMany({
            where: { id: leadId, workspaceId: ctx.workspaceId },
            data: {
              lastContactedAt: lastOut._max.occurredAt,
              lastReplyAt: lastIn._max.occurredAt,
              version: { increment: 1 },
            },
          });
        }
      });
    }
    await db.gmailConnection.deleteMany({
      where: { id: c.id, workspaceId: ctx.workspaceId, userId: ctx.userId! },
    });
    return { disconnected: true, revoked };
  }
  if (input.action === "sync") {
    await syncGmailConnection(c.id, fetcher);
    return { synced: true };
  }
  const lead = await db.lead.findFirst({
    where: {
      id: text(input.leadId, "Lead", 100),
      workspaceId: ctx.workspaceId,
      mergedAt: null,
    },
  });
  if (!lead) throw new RequestError("Lead not found.", 404);
  if (input.action === "search") {
    if (!lead.email) throw new RequestError("Add an email to this lead first.");
    const address = lead.email.replace(/["\\]/g, "");
    const query = new URLSearchParams({
      q: `from:"${address}" OR to:"${address}"`,
      maxResults: "10",
    });
    const result = await gmailGet(c, "threads?" + query, fetcher);
    const threads = await Promise.all(
      (result.threads || []).slice(0, 10).map(async (t: { id: string }) => {
        const thread = await gmailGet(
          c,
          "threads/" + encodeURIComponent(t.id) + "?format=metadata",
          fetcher,
        );
        const message = thread.messages?.at(-1) as GmailMessage | undefined;
        return {
          id: t.id,
          subject: message ? header(message, "subject") : "Conversation",
          snippet: String(thread.snippet || "").slice(0, 300),
        };
      }),
    );
    return { threads };
  }
  if (input.action === "attach") {
    if (input.confirmShare !== true)
      throw new RequestError(
        "Confirm sharing this conversation with the workspace.",
      );
    const providerThreadId = text(input.threadId, "Thread", 100);
    if (!/^[a-f0-9]+$/i.test(providerThreadId))
      throw new RequestError("Invalid Gmail thread ID.");
    const result = await gmailGet(
      c,
      "threads/" + providerThreadId + "?format=metadata",
      fetcher,
    );
    const message = result.messages?.[0] as GmailMessage | undefined;
    const thread = await db.$transaction(async (tx) => {
      const current = await tx.lead.findFirst({
        where: { id: lead.id, workspaceId: ctx.workspaceId, mergedAt: null },
      });
      if (!current)
        throw new RequestError("Lead changed. Refresh and retry.", 409);
      const t = await tx.mailThread.upsert({
        where: {
          connectionId_providerThreadId_leadId: {
            connectionId: c.id,
            providerThreadId,
            leadId: lead.id,
          },
        },
        update: {},
        create: {
          workspaceId: ctx.workspaceId,
          leadId: lead.id,
          connectionId: c.id,
          providerThreadId,
          subject: message
            ? header(message, "subject").slice(0, 300)
            : "Conversation",
          sharedBy: ctx.userId,
        },
      });
      await workspaceAudit(tx, ctx, "gmail.thread.shared", lead.id, {
        threadId: t.id,
      });
      return t;
    });
    await syncGmailConnection(c.id, fetcher);
    return { id: thread.id };
  }
  throw new RequestError("Unknown inbox action.");
}

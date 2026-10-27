import { sendOperatorEmail, smtpConfigured } from "./mail";
import { unassignRemovedMember } from "./team";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { APIError } from "better-auth/api";
import { db } from "./db";
import { appUrl, authSecret } from "./config";
let cached: ReturnType<typeof createAuth> | undefined;
function createAuth(bootstrap = false) {
  return betterAuth({
    appName: "Follow Through",
    baseURL: appUrl(),
    secret: authSecret(),
    database: prismaAdapter(db, { provider: "postgresql" }),
    emailAndPassword: { enabled: true, minPasswordLength: 12 },
    trustedOrigins: [appUrl()],
    session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 60 },
    databaseHooks: {
      user: {
        create: {
          before: async (user, context) => {
            if (bootstrap) return;
            const invitation = await db.invitation.findFirst({
              where: {
                id:
                  context?.headers?.get("x-invitation-id") ||
                  "missing-invitation-token",
                email: user.email.toLowerCase(),
                status: "pending",
                expiresAt: { gt: new Date() },
              },
            });
            if (!invitation)
              throw new APIError("FORBIDDEN", {
                message:
                  "This instance is invite-only. Ask a workspace owner for an invitation.",
              });
          },
        },
      },
    },
    plugins: [
      organization({
        allowUserToCreateOrganization: true,
        disableOrganizationDeletion: true,
        sendInvitationEmail: async (data) => {
          if (smtpConfigured())
            try {
              await sendOperatorEmail(
                data.email,
                "Join " + data.organization.name,
                appUrl() +
                  "/accept-invitation?id=" +
                  encodeURIComponent(data.id),
              );
            } catch {
              console.error(
                "Invitation email failed. Share the invitation link directly.",
              );
            }
        },
        organizationHooks: {
          beforeCreateInvitation: async ({ invitation }) => {
            if (!["owner", "member"].includes(invitation.role))
              throw new APIError("BAD_REQUEST", {
                message: "Choose owner or member.",
              });
          },
          beforeUpdateMemberRole: async ({ newRole }) => {
            if (!["owner", "member"].includes(newRole))
              throw new APIError("BAD_REQUEST", {
                message: "Choose owner or member.",
              });
          },
          beforeRemoveMember: async ({ member, organization }) => {
            await unassignRemovedMember(organization.id, member.userId);
          },
        },
        invitationExpiresIn: 60 * 60 * 24 * 7,
      }),
    ],
  });
}
export function getAuth() {
  return (cached ??= createAuth());
}
// Only imported by local administrator commands, never controlled by an HTTP parameter.
export function bootstrapAuth() {
  return createAuth(true);
}

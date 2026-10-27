import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
if (existsSync(".env")) process.loadEnvFile(".env");
const { bootstrapAuth } = await import("../src/server/auth");
const { db } = await import("../src/server/db");
const email = process.argv
  .find((a) => a.startsWith("--email="))
  ?.slice(8)
  ?.trim()
  .toLowerCase();
if (!email)
  throw new Error("Usage: npm run account:owner -- --email=you@example.com");
let password = process.env.BOOTSTRAP_PASSWORD;
if (!password) {
  stdout.write("New password (hidden): ");
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  // Suppress terminal echo while reading the password.
  (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput =
    () => {};
  password = await rl.question("");
  rl.close();
  stdout.write("\n");
}
if (password.length < 12) throw new Error("Use at least 12 characters.");
try {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    const { hashPassword } = await import("better-auth/crypto");
    await db.account.updateMany({
      where: { userId: existing.id, providerId: "credential" },
      data: { password: await hashPassword(password) },
    });
    await db.session.deleteMany({ where: { userId: existing.id } });
    console.log("Password reset; existing sessions revoked.");
  } else {
    const result = await bootstrapAuth().api.signUpEmail({
      body: { email, password, name: email.split("@")[0] },
    });
    await db.$transaction(
      async (tx) => {
        const legacy = await tx.organization.findUnique({
          where: { id: "legacy" },
          include: { members: true },
        });
        if (legacy && legacy.members.length === 0)
          await tx.member.create({
            data: {
              id: crypto.randomUUID(),
              organizationId: "legacy",
              userId: result.user.id,
              role: "owner",
            },
          });
        else {
          const id = crypto.randomUUID();
          await tx.organization.create({
            data: {
              id,
              name: "My workspace",
              slug: id,
              members: {
                create: {
                  id: crypto.randomUUID(),
                  userId: result.user.id,
                  role: "owner",
                },
              },
            },
          });
        }
      },
      { isolationLevel: "Serializable" },
    );
    console.log("Owner created. Sign in at APP_URL.");
  }
} finally {
  await db.$disconnect();
}

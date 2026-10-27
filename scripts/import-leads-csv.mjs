#!/usr/bin/env node
import fs from "node:fs";
import { createInterface } from "node:readline/promises";
if (fs.existsSync(".env")) process.loadEnvFile(".env");
const file = process.argv.slice(2).find((v) => !v.startsWith("--"));
if (!file) {
  console.error(
    "Usage: npm run import:csv -- <file.csv> [--email=you@example.com] [--workspace=workspace-id]",
  );
  process.exit(1);
}
const base = (
  process.env.APP_URL || `http://127.0.0.1:${process.env.PORT || 3115}`
).replace(/\/$/, "");
let cookie = "";
async function request(path, body) {
  const r = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body ? { "Content-Type": "application/json", Origin: base } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(process.argv.find((v) => v.startsWith("--workspace="))
        ? {
            "X-Workspace-ID": process.argv
              .find((v) => v.startsWith("--workspace="))
              .slice(12),
          }
        : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  return { r, data };
}
try {
  const status = await request("/api/account");
  if (!status.r.ok || !status.data.demo) {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    try {
      const email =
        process.argv.find((v) => v.startsWith("--email="))?.slice(8) ||
        (await rl.question("Email: "));
      let password = process.env.FOLLOW_THROUGH_PASSWORD;
      if (!password) {
        process.stdout.write("Password (hidden): ");
        rl._writeToOutput = () => {};
        password = await rl.question("");
        process.stdout.write("\n");
      }
      const { r, data } = await request("/api/auth/sign-in/email", {
        email,
        password,
      });
      if (!r.ok) throw new Error(data.message || "Sign-in failed.");
      cookie = r.headers
        .getSetCookie()
        .map((v) => v.split(";")[0])
        .join("; ");
    } finally {
      rl.close();
    }
  }
  const { r, data } = await request("/api/workspace", {
    action: "importCsv",
    csv: fs.readFileSync(file, "utf8"),
  });
  if (!r.ok)
    throw new Error(
      data.error || "Import failed. Use the UI to review duplicate matches.",
    );
  console.log(`Imported ${data.imported} contacts.`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  if (cookie) await request("/api/auth/sign-out", {}).catch(() => {});
}

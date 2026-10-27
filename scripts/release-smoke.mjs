import assert from "node:assert/strict";
const base = process.env.SMOKE_APP_URL || "http://127.0.0.1:3116";
const password = process.env.BOOTSTRAP_PASSWORD;
assert(password, "Set a temporary fixture BOOTSTRAP_PASSWORD.");
assert.equal((await fetch(base + "/api/workspace")).status, 401);
const signIn = await fetch(base + "/api/auth/sign-in/email", {
  method: "POST",
  headers: { Origin: base, "Content-Type": "application/json" },
  body: JSON.stringify({ email: "release-smoke@example.com", password }),
});
assert.equal(signIn.status, 200, "Fixture sign-in failed");
const cookie = signIn.headers
  .getSetCookie()
  .map((v) => v.split(";")[0])
  .join("; ");
const headers = {
  Cookie: cookie,
  Origin: base,
  "Content-Type": "application/json",
};
const created = await fetch(base + "/api/workspace", {
  method: "POST",
  headers,
  body: JSON.stringify({
    action: "createLead",
    name: "Release install fixture",
    email: "release-fixture@example.com",
  }),
});
assert.equal(created.status, 200);
const lead = await created.json();
assert(lead.id);
const response = await fetch(base + "/api/workspace", { headers });
assert.equal(response.status, 200);
const snapshot = await response.json();
assert(snapshot.leads.some((l) => l.id === lead.id));
const exported = await fetch(base + "/api/exports", { headers });
assert.equal(exported.status, 200);
const backup = await exported.json();
assert.equal(backup.version, 1);
assert(backup.leads.some((l) => l.id === lead.id));
assert(!JSON.stringify(backup).includes(password));
assert.equal(
  (
    await fetch(base + "/api/auth/sign-out", {
      method: "POST",
      headers,
      body: "{}",
    })
  ).status,
  200,
);
console.log(
  "Fresh install: denied anonymous access, owner sign-in, saved contact, credential-free export and sign-out passed.",
);

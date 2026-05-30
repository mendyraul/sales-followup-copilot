import assert from "node:assert/strict";
import fs from "node:fs";

const filePath = new URL("../data/demo-leads.json", import.meta.url);
const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));

assert.ok(Array.isArray(payload), "demo leads payload must be an array");
assert.ok(payload.length >= 2, "demo leads payload must include at least two entries");
assert.ok(payload.every((lead) => lead.id && lead.email), "each lead must include id and email");

console.log("seed-demo-data.test.mjs passed");

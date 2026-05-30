import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "data");
const outputPath = path.join(outputDir, "demo-leads.json");

const demoLeads = [
  {
    id: "lead_demo_001",
    fullName: "Ava Thompson",
    email: "ava.thompson@example.com",
    company: "Northwind Labs",
    status: "NEW",
    lastContactedAt: null,
    notes: "Requested pricing details after webinar.",
    createdAt: new Date().toISOString()
  },
  {
    id: "lead_demo_002",
    fullName: "Marcus Lee",
    email: "marcus.lee@example.com",
    company: "Summit Retail",
    status: "FOLLOW_UP",
    lastContactedAt: new Date(Date.now() - 86400000).toISOString(),
    notes: "Needs approval from finance before decision.",
    createdAt: new Date().toISOString()
  }
];

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(demoLeads, null, 2) + "\n");

console.log(`Wrote ${demoLeads.length} demo leads to ${outputPath}`);

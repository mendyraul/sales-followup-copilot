#!/usr/bin/env node
import fs from "node:fs";
if (fs.existsSync(".env")) process.loadEnvFile(".env");
const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run import:csv -- <path-to-csv>");
  process.exit(1);
}
try {
  // Use the same validation, atomic writes and audit trail as the UI.
  const response = await fetch(
    `http://127.0.0.1:${process.env.PORT || 3115}/api/workspace`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "importCsv",
        csv: fs.readFileSync(file, "utf8"),
      }),
    },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  console.log(`Imported ${result.imported} leads.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("private workspace sign-in, complete export and previewed restore", async ({
  page,
  request,
}) => {
  expect((await request.get("/api/workspace")).status()).toBe(401);
  await page.goto("/login");
  await page
    .getByLabel("Email", { exact: true })
    .fill("browser-owner@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("Browser-test-password-only-123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Workspace", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Import CSV", exact: true }).click();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "Export complete workspace JSON", exact: true })
    .click();
  const download = await downloadEvent;
  const file = await download.path();
  expect(file).toBeTruthy();
  const backup = JSON.parse(await readFile(file!, "utf8"));
  expect(backup.version).toBe(1);
  expect(backup.leads.length).toBeGreaterThan(0);
  expect(JSON.stringify(backup)).not.toContain("Browser-test-password");
  await page.getByLabel("Workspace JSON backup").setInputFiles({
    name: "workspace.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page
    .getByRole("button", { name: "Preview restore", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Restore new workspace", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restore new workspace", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Workspace", exact: true }),
  ).toContainText("(restored)");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back.", exact: true }),
  ).toBeVisible();
});

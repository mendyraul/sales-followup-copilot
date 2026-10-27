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

test("invited members receive handoffs and removal leaves work unassigned", async ({
  page,
  browser,
}) => {
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
  const email = `member-${Date.now()}@example.com`;
  await page
    .getByRole("button", { name: "Settings & team", exact: true })
    .click();
  await page.getByLabel("Invite email").fill(email);
  await page
    .getByRole("button", { name: "Invite member", exact: true })
    .click();
  const invite = await page.getByLabel("Private invitation link").inputValue();
  const memberContext = await browser.newContext();
  const memberPage = await memberContext.newPage();
  await memberPage.goto(invite);
  await memberPage
    .getByLabel("Name", { exact: true })
    .fill("Invited Colleague");
  await memberPage.getByLabel("Email", { exact: true }).fill(email);
  await memberPage
    .getByLabel("Password", { exact: true })
    .fill("Member-test-password-only-123!");
  await memberPage
    .getByRole("button", { name: "Join workspace", exact: true })
    .click();
  await expect(
    memberPage.getByRole("combobox", { name: "Workspace", exact: true }),
  ).toBeVisible();
  const create = await page.request.post("/api/workspace", {
    data: { action: "createLead", name: `Handoff ${Date.now()}` },
  });
  expect(create.ok()).toBe(true);
  const { id } = await create.json();
  try {
    await page.reload();
    await page.getByRole("button").filter({ hasText: "Handoff " }).click();
    const data = await (await page.request.get("/api/workspace")).json();
    const member = data.members.find(
      (m: { user: { email: string } }) => m.user.email === email,
    );
    await page
      .getByRole("combobox", { name: "Lead owner", exact: true })
      .selectOption(member.userId);
    await expect(page.getByRole("status")).toHaveText("Lead reassigned.");
    await memberPage.reload();
    await memberPage
      .getByRole("combobox", { name: "Owner filter", exact: true })
      .selectOption("MINE");
    await expect(
      memberPage.getByRole("button").filter({ hasText: "Handoff " }),
    ).toBeVisible();
    await memberPage.getByRole("button", { name: /Notifications \(/ }).click();
    await expect(memberPage.getByText(/was assigned to you/)).toBeVisible();
    await page
      .getByRole("button", { name: "Settings & team", exact: true })
      .click();
    page.once("dialog", (dialog) => dialog.accept());
    const removal=page.waitForResponse(r=>r.url().endsWith("/api/auth/organization/remove-member")&&r.request().method()==="POST");
    await page
      .locator("article")
      .filter({ hasText: email })
      .getByRole("button", { name: "Remove member", exact: true })
      .click();
    expect((await removal).ok()).toBe(true);
    await expect(
      page.getByRole("combobox", { name: "Workspace", exact: true }),
    ).toBeVisible();
    const after = await (await page.request.get("/api/workspace")).json();
    expect(
      after.leads.find((l: { id: string }) => l.id === id).ownerId,
    ).toBeNull();
    expect((await memberPage.request.get("/api/workspace")).status()).toBe(403);
  } finally {
    const data = await (await page.request.get("/api/workspace")).json();
    const lead = data.leads.find((l: { id: string }) => l.id === id);
    if (lead)
      await page.request.post("/api/workspace", {
        data: { action: "deleteLead", leadId: id, version: lead.version },
      });
    await memberContext.close();
  }
});

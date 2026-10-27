import { test, expect, type APIRequestContext } from "@playwright/test";
const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
async function post(request: APIRequestContext, body: Record<string, unknown>) {
  if (
    ["updateLead", "deleteLead"].includes(String(body.action)) &&
    body.version === undefined
  ) {
    const current = await state(request);
    const lead = current.leads.find(
      (l: { id: string }) => l.id === body.leadId,
    );
    if (lead) body = { ...body, version: lead.version };
  }
  return request.post("/api/workspace", { data: body });
}
async function state(request: APIRequestContext) {
  const r = await request.get("/api/workspace");
  expect(r.ok()).toBeTruthy();
  return r.json();
}

test("operator workflow persists leads, notes, draft revisions and feedback across reloads", async ({
  page,
  request,
}) => {
  const suffix = unique();
  const name = `Demo Buyer ${suffix}`;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("SENDING DISABLED")).toBeVisible();
  await page.getByRole("button", { name: "+ Add a lead" }).click();
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page
    .getByLabel("Email", { exact: true })
    .fill(`buyer-${suffix}@example.com`);
  await page.getByLabel("Source", { exact: true }).fill("QA referral");
  await page.getByLabel("Lead context").fill("Needs onboarding next month.");
  await page.getByRole("button", { name: "Create lead" }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const lead = (await state(request)).leads.find(
    (l: { name: string }) => l.name === name,
  );
  try {
    await page
      .getByRole("combobox", { name: "Status", exact: true })
      .selectOption("CONTACTED");
    await page.getByRole("button", { name: "Save lead", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Lead updated.");
    await page
      .getByLabel("Add a note")
      .fill("Requested a concise pricing recap.");
    await page.getByRole("button", { name: "Save note" }).click();
    await expect(page.getByRole("status")).toHaveText("Note saved.");
    await page.getByLabel("Desired next step").fill("book a 15-minute review");
    await page.getByRole("button", { name: "Generate draft" }).click();
    await expect(page.getByLabel("Draft body")).toHaveValue(
      /Requested a concise pricing recap/,
    );
    await page
      .getByLabel("Draft body")
      .fill(
        "Hi Demo Buyer, here is the requested pricing recap. Can we book 15 minutes?",
      );
    await page.getByRole("button", { name: "Save revision" }).click();
    await expect(
      page.getByRole("heading", { name: "Draft · revision 2", exact: true }),
    ).toBeVisible();
    await page.reload();
    await page.getByRole("button").filter({ hasText: name }).click();
    await expect(page.getByLabel("Draft body")).toHaveValue(
      /here is the requested pricing recap/,
    );
    await expect(
      page
        .getByRole("list")
        .getByText("Requested a concise pricing recap.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Approve draft" }).click();
    await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
    await page
      .getByLabel("Draft body")
      .fill("Updated after approval; needs another review.");
    await page.getByRole("button", { name: "Save revision" }).click();
    await expect(page.getByText("NEEDS REVIEW", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Reject draft" }).click();
    await expect(page.getByText("REJECTED", { exact: true })).toBeVisible();
    await page.getByLabel("Opted out of follow-up").check();
    await page.getByRole("button", { name: "Save lead", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Generate draft" }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Activity & feedback" }).click();
    await page
      .getByLabel("Feedback", { exact: true })
      .fill(`Helpful workflow ${suffix}`);
    await page.getByRole("button", { name: "Save feedback" }).click();
    await expect(page.getByRole("status")).toHaveText(
      "Feedback saved. Thank you.",
    );
    await page.reload();
    await page.getByRole("button", { name: "Activity & feedback" }).click();
    await expect(
      page.getByText(`Helpful workflow ${suffix}`, { exact: true }),
    ).toBeVisible();
    const saved = (await state(request)).leads.find(
      (l: { id: string }) => l.id === lead.id,
    );
    expect(saved.drafts[0].revisions).toHaveLength(5);
    expect(
      saved.events.some(
        (e: { eventType: string }) => e.eventType === "FOLLOW_UP_SENT",
      ),
    ).toBe(false);
    expect(errors).toEqual([]);
    await page
      .getByRole("button", { name: "Lead workspace", exact: true })
      .click();
    await page.getByRole("button").filter({ hasText: name }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "Delete lead", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText("Lead deleted.");
  } finally {
    await post(request, { action: "deleteLead", leadId: lead.id });
  }
  const final = await state(request);
  expect(final.leads.some((l: { id: string }) => l.id === lead.id)).toBe(false);
  expect(
    final.audit.some(
      (a: { action: string; entityId: string }) =>
        a.action === "lead.deleted" && a.entityId === lead.id,
    ),
  ).toBe(true);
});

test("API rejects malformed changes, invalid transitions, stale reviews and cross-origin writes", async ({
  request,
}) => {
  expect(
    (
      await request.get("/api/workspace", {
        headers: { Host: "foreign.example:3120" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/workspace", {
        data: {},
        headers: { Origin: "null" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.post("/api/workspace", { data: "plain text" })).status(),
  ).toBe(415);
  const created = await post(request, {
    action: "createLead",
    name: `API ${unique()}`,
  });
  expect(created.ok()).toBe(true);
  const { id } = await created.json();
  try {
    expect(
      (
        await post(request, {
          action: "createLead",
          name: "bad",
          email: "invalid",
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await post(request, {
          action: "updateLead",
          leadId: id,
          name: "invalid jump",
          status: "WON",
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await post(request, { action: "feedback", rating: 8, comments: "bad" })
      ).status(),
    ).toBe(400);
    expect(
      (
        await request.post("/api/workspace", {
          data: { action: "deleteLead", leadId: id },
          headers: { Origin: "https://example.net" },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.post("/api/workspace", {
          data: "{",
          headers: { "Content-Type": "application/json" },
        })
      ).status(),
    ).toBe(400);
    expect(
      (await post(request, { action: "generateDraft", leadId: id })).ok(),
    ).toBe(true);
    const draft = (await state(request)).leads.find(
      (l: { id: string }) => l.id === id,
    ).drafts[0];
    const review = {
      action: "reviewDraft",
      leadId: id,
      draftId: draft.id,
      revision: 1,
      subject: draft.subject,
      content: draft.content,
      decision: "approved",
    };
    const reviews = await Promise.all([
      post(request, review),
      post(request, review),
    ]);
    expect(reviews.map((r) => r.status()).sort()).toEqual([200, 409]);
    await post(request, {
      action: "updateLead",
      leadId: id,
      name: `Opted ${unique()}`,
      unsubscribed: true,
    });
    expect(
      (await post(request, { action: "generateDraft", leadId: id })).status(),
    ).toBe(409);
  } finally {
    await post(request, { action: "deleteLead", leadId: id });
  }
});

test("CSV import handles quoted commas, rolls back conflicts and survives reload; mobile layout fits", async ({
  page,
  request,
}) => {
  const suffix = unique();
  const name = `CSV, Buyer ${suffix}`;
  const email = `csv-${suffix}@example.com`;
  await page.goto("/");
  await page.getByRole("button", { name: "Import CSV" }).click();
  await page
    .getByLabel("CSV content")
    .fill(`name,email,source,status\n"${name}",${email},Referral,new`);
  await page.getByRole("button", { name: "Import 1 leads" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "CSV imported. Open the lead workspace to review.",
  );
  const lead = (await state(request)).leads.find(
    (l: { name: string }) => l.name === name,
  );
  try {
    const conflictName = `Rollback ${suffix}`;
    const failed = await post(request, {
      action: "importCsv",
      csv: `name,email\n${conflictName},rollback-${suffix}@example.com\nOther,${email}`,
    });
    expect(failed.status()).toBe(409);
    expect(
      (await state(request)).leads.some(
        (l: { name: string }) => l.name === conflictName,
      ),
    ).toBe(false);
    await page.reload();
    await page.getByLabel("Search leads").fill(name);
    await expect(
      page.getByRole("button").filter({ hasText: name }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      page.getByRole("button").filter({ hasText: name }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/demo-mobile.png",
      fullPage: true,
    });
  } finally {
    await post(request, { action: "deleteLead", leadId: lead.id });
  }
});

test("scheduled tasks and quick interaction logging work in the browser", async ({
  page,
  request,
}) => {
  const name = `Tasks ${unique()}`;
  const response = await post(request, { action: "createLead", name });
  const { id } = await response.json();
  try {
    await page.goto("/");
    await page.getByRole("button").filter({ hasText: name }).click();
    await page.getByLabel("Next action title").fill("Review the proposal");
    await page
      .getByLabel("Due date (UTC)", { exact: true })
      .fill("2030-01-20T10:00");
    await page
      .getByRole("button", { name: "Schedule task", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText("Task scheduled.");
    await page.getByRole("button", { name: "Tomorrow", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Task rescheduled.");
    await page
      .getByRole("button", { name: "Complete task", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText("Task completed.");
    await page
      .getByRole("button", { name: "Log interaction", exact: true })
      .click();
    await page.getByLabel("Interaction outcome").selectOption("EMAILED");
    await page
      .getByLabel("Interaction note")
      .fill("Sent an actual proposal recap.");
    await page
      .getByRole("button", { name: "Save interaction", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText("Interaction saved.");
    await page.reload();
    await page.getByRole("button").filter({ hasText: name }).click();
    const saved = (await state(request)).leads.find(
      (l: { id: string }) => l.id === id,
    );
    expect(saved.lastContactedAt).not.toBeNull();
    expect(saved.tasks[0].status).toBe("COMPLETED");
    expect(saved.interactions).toHaveLength(1);
  } finally {
    await post(request, { action: "deleteLead", leadId: id });
  }
});

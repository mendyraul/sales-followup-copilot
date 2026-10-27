import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { trace: "retain-on-failure" },
  projects: [
    {
      name: "demo",
      testMatch: "workspace.spec.ts",
      use: { baseURL: "http://127.0.0.1:3120" },
    },
    {
      name: "authenticated",
      testMatch: "authenticated.spec.ts",
      use: { baseURL: "http://127.0.0.1:3121" },
    },
  ],
  webServer: [
    {
      command: "npm run start -- --port 3120",
      url: "http://127.0.0.1:3120",
      reuseExistingServer: false,
      timeout: 90000,
      env: { APP_MODE: "demo", APP_URL: "http://127.0.0.1:3120" },
    },
    {
      command:
        "npm run account:owner -- --email=browser-owner@example.com && npm run start -- --port 3121",
      url: "http://127.0.0.1:3121",
      reuseExistingServer: false,
      timeout: 90000,
      env: {
        APP_MODE: "selfhost",
        APP_URL: "http://127.0.0.1:3121",
        BOOTSTRAP_PASSWORD: "Browser-test-password-only-123!",
      },
    },
  ],
});

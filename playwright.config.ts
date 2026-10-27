import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://127.0.0.1:3120", trace: "retain-on-failure" },
  webServer: {
    command: "npm run start -- --port 3120",
    url: "http://127.0.0.1:3120",
    reuseExistingServer: false,
    timeout: 60000,
  },
});

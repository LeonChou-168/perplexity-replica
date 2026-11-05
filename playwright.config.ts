import { defineConfig, devices } from "@playwright/test";

const port = 4179;
const baseURL = `http://127.0.0.1:${port}`;

const viewports = [
  { name: "wide", width: 1440, height: 900 },
  { name: "desktop", width: 1280, height: 720 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const locales = ["en-US", "zh-CN"] as const;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never", outputFolder: "output/playwright/report" }]]
    : "list",
  outputDir: "output/playwright/test-results",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    channel: "chrome",
    colorScheme: "light",
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: viewports.flatMap(({ name, width, height }) =>
    locales.map((locale) => ({
      name: `${name}-${locale}`,
      use: { locale, viewport: { width, height } },
    })),
  ),
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

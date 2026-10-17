import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4173/civilizacao-de-bolso/",
    trace: "retain-on-failure",
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] }
      : {},
  },
  projects: [
    {
      name: "android-emulado",
      use: { ...devices["Pixel 7"], defaultBrowserType: "chromium" },
    },
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://127.0.0.1:4173/civilizacao-de-bolso/",
    reuseExistingServer: !process.env.CI,
  },
});

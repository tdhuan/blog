import { defineConfig } from "@playwright/test";

// Contrast (axe color-contrast — the same engine behind Lighthouse's
// audit) against the production build, so it sees what Lighthouse sees.
// Run `pnpm test:a11y` (builds first). Port is pinned to 4322 so a
// dev server on the default 4321 never satisfies the health check.
export default defineConfig({
  testDir: "tests",
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4322",
  },
  webServer: {
    command: "pnpm exec astro preview --port 4322",
    url: "http://localhost:4322",
    reuseExistingServer: false,
  },
});

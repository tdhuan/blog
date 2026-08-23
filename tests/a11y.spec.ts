import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// WCAG AA color-contrast across every page in every theme. The theme is
// forced via localStorage before load — the inline head script in
// Layout.astro picks it up before first paint. Real ratios are only
// measurable when text has a resolvable ancestor background (see the
// body background-color note in global.css).
const pages = ["/", "/about", "/cv"] as const;
const themes = ["sepia", "light", "dark"] as const;

for (const path of pages) {
  for (const theme of themes) {
    test(`${path} (${theme}) passes color-contrast`, async ({ page }) => {
      await page.addInitScript((t) => {
        try {
          localStorage.setItem("theme", t);
        } catch {
          // storage blocked — head script falls back to sepia
        }
      }, theme);
      await page.goto(path);

      const results = await new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .analyze();

      expect(
        results.violations.flatMap((v) =>
          v.nodes.map((n) => `${n.target}: ${n.failureSummary}`),
        ),
      ).toEqual([]);
    });
  }
}

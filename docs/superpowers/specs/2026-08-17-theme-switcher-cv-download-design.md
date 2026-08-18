# Theme Switcher & CV Print Download — Design

- **Date:** 2026-08-17
- **Status:** Approved in brainstorming — ready for implementation planning

## Summary

Add a three-way theme switcher (sepia / light / dark) to the site, and make the
CV page downloadable as a light-mode PDF via the browser's print dialog. Theming
works by overriding semantic CSS custom properties under a `data-theme`
attribute on `<html>` — no framework, no re-render, one attribute swap re-skins
every Tailwind utility. CV data moves out of `cv.astro` into a typed module so
the page and the print output share one source of truth.

## Decisions

| Decision                              | Choice                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Default theme for first-time visitors | Sepia (today's look). No `prefers-color-scheme` detection.                                                      |
| Persistence                           | `localStorage` key `"theme"` per browser. No cross-tab sync.                                                    |
| Switcher UI                           | 3-way segmented icon control in the header, built on native radio inputs.                                       |
| CV download mechanism                 | Print-to-PDF (`window.print()` + print stylesheet forcing light). No static PDF file, no build-time generation. |
| Download button placement             | **Replaces** the "View experience" anchor in the CV header. The "Open to opportunities" indicator stays.        |

## 1. Theme architecture

### Mechanism

`<html data-theme="sepia" | "light" | "dark">`.

- `@theme` in `src/styles/global.css` keeps declaring every token (so Tailwind
  keeps generating utilities) with today's sepia values — these remain the
  `:root` default, so no-JS visitors and first paint get today's look with zero
  JavaScript.
- `html[data-theme="light"]` and `html[data-theme="dark"]` blocks override the
  semantic variables. `html[data-theme]` (0,1,1) out-specifies `:root` (0,1,0),
  so overrides always win; every utility compiles to `var(--color-…)`, so the
  whole site re-skins.
- Each override block also sets `color-scheme` (`light` / `dark`) so scrollbars
  and native controls match.
- The brown palette ramp (`--color-brown-*`) stays fixed in `@theme`. Themes
  reassign **semantic** meaning only.

### Token sweep

Hardcoded palette utilities are promoted to semantic tokens (following the
existing `on-background` naming):

| Today                                 | Becomes                                           | Used for                      |
| ------------------------------------- | ------------------------------------------------- | ----------------------------- |
| `text-brown-800` (×2)                 | `text-primary` (brown-800 _is_ `--color-primary`) | CV h3 headings                |
| `text-brown-700` (×2)                 | `--color-on-background-variant`                   | body copy                     |
| `text-brown-600` (×7)                 | `--color-on-background-muted`                     | secondary text, contact links |
| `text-brown-500` (×9 incl. `marker:`) | `--color-on-background-faint`                     | eyebrow labels, list markers  |
| `bg-brown-200/85`, `bg-brown-200/10`  | `--color-accent-soft`                             | timeline dots, washes         |
| `bg-brown-400/10`                     | `--color-accent-faint`                            | washes                        |

Affected files (candidates from codebase inspection; the sweep must re-grep at
implementation time and is complete only when no `brown-*` utility remains in
`src/` outside `global.css`): `src/pages/cv.astro`, `src/pages/index.astro`,
`src/pages/about.astro`, `src/components/Hero.astro`, `src/components/PostCard.astro`,
`src/components/ArrowLink.astro`.

### Theme palettes

Starting values — final values are tuned against the dev server during
implementation, keeping body/label text contrast ≥ 4.5:1 (computed, not
eyeballed).

| Token                           | sepia (today)       | light                 | dark                         |
| ------------------------------- | ------------------- | --------------------- | ---------------------------- |
| `--color-background`            | `#eae9e3`           | `#faf9f7`             | `#171210`                    |
| `--color-on-background`         | `#1e1b18`           | `#1e1b18`             | `#ece4dd`                    |
| `--color-on-background-variant` | brown-700 `#5d362b` | brown-700 (unchanged) | `#c9b8ac`                    |
| `--color-on-background-muted`   | brown-600 `#70483a` | brown-600 (unchanged) | `#b09a8c`                    |
| `--color-on-background-faint`   | brown-500 `#85604f` | brown-500 (unchanged) | brown-400 `#9e7a66`          |
| `--color-surface`               | `#fff8f5`           | `#ffffff`             | `#201a16`                    |
| `--color-on-surface`            | `#1e1b18`           | `#1e1b18`             | `#ece4dd`                    |
| `--color-primary`               | brown-800 `#4c2525` | brown-800 (unchanged) | `#c9ad97` (brown-300 family) |
| `--color-on-primary`            | `#ffffff`           | `#ffffff`             | `#241a15`                    |
| `--color-surface-subtle`        | `#fbf2ed`           | `#f5f4f2`             | `#241d18`                    |
| `--color-surface-muted`         | `#f5ece7`           | `#f0efec`             | `#2a221d`                    |
| `--color-surface-elevated`      | `#efe6e2`           | `#eae9e6`             | `#2f2620`                    |
| `--color-surface-strong`        | `#e9e1dc`           | `#e4e3e0`             | `#362c25`                    |
| `--color-inverse-surface`       | `#34302c`           | `#34302c`             | `#ece4dd`                    |
| `--color-inverse-on-surface`    | `#f8efea`           | `#f8efea`             | `#34302c`                    |
| `--color-drop`                  | `#eadac7`           | `#f0e9e2`             | `#241b16`                    |
| `--color-accent-soft`           | brown-200 `#d5c1b2` | brown-200 (unchanged) | `#6f5f56`                    |
| `--color-accent-faint`          | brown-400 `#9e7a66` | brown-400 (unchanged) | `#4a3e38`                    |
| `--color-outline`               | `#8a7171`           | `#8a7171`             | `#6f5f56`                    |
| `--color-outline-variant`       | `#ddc0c0`           | `#e0d5d0`             | `#4a3e38`                    |

`primary` flips light in dark mode because it drives 23 heading/link usages.
Light mode keeps the existing browns for text (already tuned for light
backgrounds). Dark-mode noise overlay: review `.background-drop` at 10% noise —
if it reads stronger on espresso than on sepia, lower the opacity for the dark
theme (acceptance criterion, not an optional nicety).

### FOUC prevention (`Layout.astro`)

`<html data-theme="sepia">` is server-rendered. First thing in `<head>`, a
blocking inline script:

```js
try {
  var t = localStorage.getItem("theme");
  document.documentElement.dataset.theme =
    ["sepia", "light", "dark"].indexOf(t) === -1 ? "sepia" : t;
} catch (e) {
  document.documentElement.dataset.theme = "sepia";
}
```

Runs before first paint — no flash of wrong theme.

## 2. ThemeSwitcher component

`src/components/ThemeSwitcher.astro`, placed in the `Header` beside the nav.

- **Native radio inputs** (`name="theme"`, visually hidden) with styled icon
  labels inside a `<fieldset>` — arrow-key navigation, tabbing, and
  `aria-checked` come from the platform; no re-implemented radio semantics.
- The `<fieldset>` carries a visually-hidden `<legend>` ("Theme") so the
  radiogroup has an accessible name.
- Icons in the site's existing inline-SVG stroke style (`viewBox="0 0 24 24"`):
  paper/swatch glyph = sepia, sun = light, moon = dark. Each radio gets a
  visually-hidden label text; the icon is `aria-hidden`.
- Active segment highlighted (elevated background, primary icon); inactive
  muted — exact styling tuned at implementation alongside existing patterns.
- Server renders `sepia` checked (matches the no-JS default). The component's
  bundled `<script>`:
  1. on load, syncs the checked radio to the current `data-theme` (the inline
     head script has already set the attribute pre-paint; the radio catches up
     when the module runs — accepted, imperceptible),
  2. listens for `change` → sets `document.documentElement.dataset.theme` and
     `localStorage.setItem("theme", value)`.
- Mobile: control is compact (~84px) and sits beside the nav; verified at
  375px during implementation.

### Theme-change animation

Color-only transitions (`background-color`, `color`, `border-color`, `fill`,
`stroke`, ~200ms) under a `theme-anim` class on `<html>`, gated by
`(prefers-reduced-motion: no-preference)`. The switcher adds the class **only
for ~250ms while a swap happens** and removes it after — a permanently-present
`*`-scoped transition rule would override the site's per-element
`transition-*` utilities (nav underline width, ArrowLink opacity). No
cross-fade on page load (class never present then); reduced-motion users get
an instant swap.

## 3. CV: single data source

`src/data/cv.ts` — typed exports; `cv.astro` imports and renders them, markup
otherwise unchanged (apart from the token sweep):

- `profile` — name, role, summary, contacts (email / phone / github, each with
  `href` + label)
- `experience` — today's entry array (title / company / period / summary /
  highlights / stack)
- `education` — institution / degree / period

## 4. Print stylesheet

`src/styles/print.css`, imported once in `Layout.astro` (every page prints
sane, not just the CV).

- **Forced light, DRY:** light values are defined once as raw custom
  properties (`--light-background`, `--light-surface`, …) on `:root`, then
  assigned in **both** places:

  ```css
  html[data-theme="light"] {
    --color-background: var(--light-background); /* … */
  }
  @media print {
    /* html:root — not bare :root — so the block ties html[data-theme="dark"]'s
       specificity and wins on later source order in every theme */
    html:root {
      --color-background: var(--light-background); /* … */
    }
  }
  ```

  Printing from sepia or dark yields the identical light result; no duplicated
  hexes to drift. Text tokens intentionally diverge from `--light-*` on paper:
  neutral grays for contrast on white — primary/accent `#262626`
  (neutral-800), body `#171717` (neutral-900), muted `#262626`, faint
  `#404040` (neutral-700) — and `--color-outline-variant` maps to `#a3a3a3`
  so the rules match the neutral text.

- `@page { size: A4; margin: 14mm }`, `color-scheme: light`, flat white body
  background (no noise texture — ink).
- Chrome hidden via a shared `no-print` class: `Header`, `Footer`,
  `BackToTop`, `ThemeSwitcher`, and the download button.
- `break-inside: avoid` on small units only (contact block, strength bullets,
  skill rows) so they never split; experience entries flow line-by-line across
  page breaks instead of jumping whole-block to the next page. Type compacted
  via a 13px print root (~13% smaller, body ≈ 12px); the name and all headings
  print `font-semibold`; all non-heading text prints at a uniform `text-sm`
  (≈ 11.4px on paper) via `print:text-sm` (`sm:print:text-sm` where responsive
  sizes would outrank it).
- CV timeline ornaments (dots + rail) carry `no-print`; hiding the ornament
  column left-aligns each experience entry with the section heading.
- The header contact block mirrors the `lg` row in print (`print:flex-row …`
  on the header wrapper, `print:min-w-60` on `<address>`), with a thin
  `border-l` rule separating it from the name block.
- Each section heading (`Strengths`, `Skills`, `Work Experience`, `Education`)
  uses the `SectionHeading` component: heading text with a thin rule filling
  the row to the right margin, on screen and in print. The rule is a
  `border-t` filler span, so it prints without `print-color-adjust` (print
  dialogs drop background graphics).
- Trims decorative top padding on `main` in print, and the header's bottom
  padding (`print:pb-0`) so the first section starts one standard section-gap
  below the profile instead of a doubled one.

## 5. Download button (`cv.astro`)

A `Download CV` button (with download icon, focus-visible styles per existing
patterns) **replaces** the "View experience" anchor in the CV header — same
row as "Open to opportunities". `<button type="button" data-print-cv
class="no-print …">`; a bundled script binds it to `window.print()`; its
tooltip/label makes the "Save as PDF" step clear. JS-required by design on a
static site; `noscript` visitors can use the browser's own print command and
get the same light output.

## Error handling

| Situation                             | Behavior                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `localStorage` blocked (private mode) | try/catch → sepia; site works, choice not remembered                         |
| Corrupt/unknown stored value          | validated against the three names → sepia                                    |
| JavaScript disabled                   | server-rendered `data-theme="sepia"` + `:root` defaults = today's exact look |
| Print with JS disabled                | `print.css` is pure CSS → light output still works                           |
| Cross-tab sync                        | out of scope                                                                 |

## Verification

No test suite exists, so per `CLAUDE.md`: `pnpm check`, `pnpm exec eslint .`,
`pnpm exec prettier . --check`, `pnpm build`, plus a manual matrix:

- 3 themes × 5 pages (`index`, `blog`, `notes`, `about`, `cv`) visual pass
- Dark-mode text contrast ≥ 4.5:1 for `on-background` / `-variant` / `-muted` /
  `-faint` (computed ratios, recorded in the PR)
- Persistence across reload and new tab
- FOUC check: throttled reload shows no wrong-theme flash
- Switcher: keyboard (tab + arrows), radiogroup semantics, 375px fit beside nav
- Print preview from each theme → identical light A4 output; experience
  entries flow line-by-line across page breaks; chrome and download button
  hidden
- Reduced motion: theme swap is instant, no transition

## Files touched

| File                                                                                                                                  | Change                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/styles/global.css`                                                                                                               | per-theme override blocks, 5 new semantic tokens, `color-scheme`, `--light-*` raw props |
| `src/styles/print.css`                                                                                                                | **new**                                                                                 |
| `src/layouts/Layout.astro`                                                                                                            | inline FOUC script, `data-theme="sepia"`, `print.css` import                            |
| `src/components/ThemeSwitcher.astro`                                                                                                  | **new** — segmented radio control + script                                              |
| `src/components/Header.astro`                                                                                                         | switcher placement, `no-print`                                                          |
| `src/components/Footer.astro` / `BackToTop.astro`                                                                                     | `no-print`                                                                              |
| `src/data/cv.ts`                                                                                                                      | **new** — profile / experience / education                                              |
| `src/pages/cv.astro`                                                                                                                  | consume `cv.ts`, replace "View experience" with download button                         |
| `src/pages/index.astro`, `about.astro`, `blog.astro`, `notes.astro`, `src/components/Hero.astro`, `PostCard.astro`, `ArrowLink.astro` | token sweep                                                                             |

## Implementation order

1. `global.css` — new semantic tokens + per-theme blocks + `--light-*` raws
2. Token sweep across pages and components (site still renders identically in sepia)
3. `Layout.astro` — inline FOUC script, `data-theme` default, `print.css` import
4. `ThemeSwitcher.astro` + `Header` integration
5. `cv.ts` extraction + `cv.astro` refactor + download button
6. `print.css` + `no-print` classes
7. Full verification matrix

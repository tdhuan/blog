# Theme Switcher & CV Print Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A three-way theme switcher (sepia / light / dark) for the site and a light-mode PDF download for the CV page, driven by one shared data module.

**Architecture:** Themes are `data-theme` attribute values on `<html>`; `html[data-theme="light"]` / `html[data-theme="dark"]` blocks override the semantic CSS custom properties that every Tailwind utility compiles to, so one attribute swap re-skins the site with no framework JS. The CV data moves to `src/data/cv.ts`; a print stylesheet forces the light token values under `@media print` regardless of active theme, and a download button calls `window.print()`.

**Tech Stack:** Astro (static, no SSR), Tailwind CSS v4 via the Vite plugin (`@theme` tokens in `src/styles/global.css`, no config file), TypeScript strict, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-17-theme-switcher-cv-download-design.md` — read it before starting. Where this plan refines the spec, the refinement is flagged with **[plan refinement]** and the spec has been updated to match.

## Global Constraints

- Package manager pnpm; Node >= 22.12.0.
- **No test suite exists.** Verification per task = the commands given in the task plus the manual browser checks. Do not invent a test framework (YAGNI).
- Work in a worktree created via the `superpowers:using-git-worktrees` skill (required by `CLAUDE.md`). Never implement on `master` directly. Do not merge or delete the worktree unless explicitly requested.
- Run after every task: `pnpm check` (type-check), `pnpm exec eslint .`, `pnpm exec prettier . --check`, and at the end of the task `pnpm build`. All must pass before the task's commit. If `prettier --check` flags files you touched, run `pnpm exec prettier <those files> --write` and re-check.
- Commit style: lowercase conventional commits (`feat: …`, `refactor: …`, `docs: …`), no co-author footer.
- Tailwind v4: **no** `tailwind.config` file. Tokens live in `@theme` in `src/styles/global.css`. Use built-in utilities first; the memory rule "prefer built-in Tailwind utilities" applies.
- Semantic tokens only in markup — after Task 2, no `brown-*` utility may appear in `src/` outside `global.css`.
- The dev server: `pnpm dev` (background mode; `pnpm exec astro dev status` / `logs` to inspect). Site URL is printed on start (default `http://localhost:4321`).
- Verified contrast ratios (WCAG, computed from the spec's palettes — all ≥ 4.5:1):
  - dark on `#171210`: on-background `#ece4dd` 14.78 · variant `#c9b8ac` 9.67 · muted `#b09a8c` 6.94 · faint `#9e7a66` 4.80 · primary `#c9ad97` 8.76
  - dark on surface `#201a16`: on-surface 13.69 · primary 8.12
  - light on `#faf9f7`: on-background 16.29 · variant 9.84 · muted 7.46 · faint 5.28 · primary 12.48

---

### Task 1: Theme tokens and per-theme override blocks in `global.css`

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: existing `@theme` tokens and `--color-brown-*` palette.
- Produces (used by Tasks 2–6): CSS custom properties `--color-on-background-variant`, `--color-on-background-muted`, `--color-on-background-faint`, `--color-accent-soft`, `--color-accent-faint` (hence Tailwind utilities `text-on-background-variant`, `text-on-background-muted`, `text-on-background-faint`, `bg-accent-soft/…`, `bg-accent-faint/…`); raw `--light-*` properties consumed by Task 6's print stylesheet; class `theme-anim` toggled by Task 4.

- [ ] **Step 1: Add the five new semantic tokens to `@theme`**

In `src/styles/global.css`, inside the `@theme` block, directly after the `--color-on-background: #1e1b18;` line, insert:

```css
  --color-on-background-variant: var(--color-brown-700);
  --color-on-background-muted: var(--color-brown-600);
  --color-on-background-faint: var(--color-brown-500);
```

And directly after the `--color-drop: #eadac7;` line (still inside `@theme`), insert:

```css
  /* Decorative accents (timeline dots, washes) */
  --color-accent-soft: var(--color-brown-200);
  --color-accent-faint: var(--color-brown-400);
```

Sepia's values are the `@theme` defaults, so the site renders identically before any switching exists.

- [ ] **Step 2: Add the raw light values and both theme blocks after `@theme`**

After the closing `}` of the `@theme` block and before `@utility container-page`, insert (top-level, unlayered — attribute-selector specificity `(0,1,1)` beats `:root`'s `(0,1,0)` regardless of order):

```css
/*
 * Themes (spec §1). Sepia needs no block — its values ARE the :root
 * defaults in @theme above. The raw --light-* values are declared once
 * here and consumed by BOTH html[data-theme="light"] and the print
 * stylesheet (src/styles/print.css), so screen-light and paper-light
 * can never drift apart.
 */
:root {
  --light-background: #faf9f7;
  --light-on-background: #1e1b18;
  --light-on-background-variant: #5d362b;
  --light-on-background-muted: #70483a;
  --light-on-background-faint: #85604f;
  --light-surface: #ffffff;
  --light-on-surface: #1e1b18;
  --light-primary: #4c2525;
  --light-on-primary: #ffffff;
  --light-secondary: #635d58;
  --light-on-secondary: #ffffff;
  --light-inverse-surface: #34302c;
  --light-inverse-on-surface: #f8efea;
  --light-drop: #f0e9e2;
  --light-surface-subtle: #f5f4f2;
  --light-surface-muted: #f0efec;
  --light-surface-elevated: #eae9e6;
  --light-surface-strong: #e4e3e0;
  --light-accent-soft: #d5c1b2;
  --light-accent-faint: #9e7a66;
  --light-outline: #8a7171;
  --light-outline-variant: #e0d5d0;
}

html[data-theme="light"] {
  color-scheme: light;
  --color-background: var(--light-background);
  --color-on-background: var(--light-on-background);
  --color-on-background-variant: var(--light-on-background-variant);
  --color-on-background-muted: var(--light-on-background-muted);
  --color-on-background-faint: var(--light-on-background-faint);
  --color-surface: var(--light-surface);
  --color-on-surface: var(--light-on-surface);
  --color-primary: var(--light-primary);
  --color-on-primary: var(--light-on-primary);
  --color-secondary: var(--light-secondary);
  --color-on-secondary: var(--light-on-secondary);
  --color-inverse-surface: var(--light-inverse-surface);
  --color-inverse-on-surface: var(--light-inverse-on-surface);
  --color-drop: var(--light-drop);
  --color-surface-subtle: var(--light-surface-subtle);
  --color-surface-muted: var(--light-surface-muted);
  --color-surface-elevated: var(--light-surface-elevated);
  --color-surface-strong: var(--light-surface-strong);
  --color-accent-soft: var(--light-accent-soft);
  --color-accent-faint: var(--light-accent-faint);
  --color-outline: var(--light-outline);
  --color-outline-variant: var(--light-outline-variant);
}

html[data-theme="dark"] {
  color-scheme: dark;
  --color-background: #171210;
  --color-on-background: #ece4dd;
  --color-on-background-variant: #c9b8ac;
  --color-on-background-muted: #b09a8c;
  --color-on-background-faint: #9e7a66;
  --color-surface: #201a16;
  --color-on-surface: #ece4dd;
  --color-primary: #c9ad97;
  --color-on-primary: #241a15;
  --color-secondary: #b09a8c;
  --color-on-secondary: #241a15;
  --color-inverse-surface: #ece4dd;
  --color-inverse-on-surface: #34302c;
  --color-drop: #241b16;
  --color-surface-subtle: #241d18;
  --color-surface-muted: #2a221d;
  --color-surface-elevated: #2f2620;
  --color-surface-strong: #362c25;
  --color-accent-soft: #6f5f56;
  --color-accent-faint: #4a3e38;
  --color-outline: #6f5f56;
  --color-outline-variant: #4a3e38;
}
```

(`--color-secondary`/`--color-on-secondary` are currently unused by markup but are part of the semantic set — overriding them keeps the dark theme free of low-contrast traps if they get used later.)

- [ ] **Step 3: Add the dark-mode noise adjustment and the `theme-anim` transition rule**

The `.background-drop` noise SVG (in `@layer base` in this same file) renders at `opacity 0.1`, which reads too strong on the espresso background. Append after the dark block from Step 2:

```css
/* Same noise SVG as .background-drop but at opacity 0.05 — 10% reads
   too strong on the espresso background (spec §1 acceptance criterion). */
html[data-theme="dark"] .background-drop {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
}
```

And at the end of the file:

```css
/* Theme-swap animation (spec §2). The class is added by the switcher for
   ~250ms only while a swap happens, so per-element transition utilities
   (nav underline, ArrowLink) are untouched the rest of the time. */
@media (prefers-reduced-motion: no-preference) {
  html.theme-anim,
  html.theme-anim *,
  html.theme-anim *::before,
  html.theme-anim *::after {
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      color 0.2s ease,
      fill 0.2s ease,
      stroke 0.2s ease !important;
  }
}
```

**[plan refinement]** The spec originally had the inline head script add `theme-anim` permanently after first paint. A permanent `*`-scoped transition rule overrides the site's per-element `transition-*` utilities (header underline width, ArrowLink opacity) — so the class is time-boxed to the swap instead. Spec updated to match.

- [ ] **Step 4: Verify — build, sepia parity, manual theme smoke test**

Run:

```bash
pnpm check && pnpm exec eslint . && pnpm exec prettier . --check && pnpm build
```

Expected: all pass.

Then `pnpm dev`, open the site, and in DevTools → Elements select `<html>` and set `data-theme` to `light`, then `dark`, then remove it. Expected: every page re-skins; sepia (no attribute) looks pixel-identical to `master`; in dark, the noise overlay is subtle, not gritty.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add semantic theme tokens and light/dark overrides"
```

---

### Task 2: Token sweep — replace every `brown-*` utility with semantic tokens

**Files:**
- Modify: `src/pages/cv.astro`
- Modify: `src/components/Hero.astro`
- Modify: `src/components/PostCard.astro`
- Modify: `src/components/ArrowLink.astro`

**Interfaces:**
- Consumes: utilities from Task 1 (`text-on-background-variant`, `text-on-background-muted`, `text-on-background-faint`, `bg-accent-soft/…`, `bg-accent-faint/…`).
- Produces: a `src/` tree where `brown-*` utilities exist only in `global.css` (verified by grep). Task 5's rewrite of `cv.astro` builds on these class names.

- [ ] **Step 1: `Hero.astro` — 2 edits**

| Line | Old | New |
|---|---|---|
| 11 | `font-label text-brown-500 text-xs font-medium tracking-wide uppercase sm:text-sm` | `font-label text-on-background-faint text-xs font-medium tracking-wide uppercase sm:text-sm` |
| 20 | `font-regular text-brown-600 max-w-xl text-base lg:text-lg` | `font-regular text-on-background-muted max-w-xl text-base lg:text-lg` |

- [ ] **Step 2: `PostCard.astro` — 2 edits**

| Line | Old | New |
|---|---|---|
| 2 | `group gap-gutter hover:bg-brown-200/10 flex flex-col items-start px-3 py-10 md:flex-row md:py-12` | `group gap-gutter hover:bg-accent-soft/10 flex flex-col items-start px-3 py-10 md:flex-row md:py-12` |
| 5 | `font-label text-brown-500 text-xs uppercase` | `font-label text-on-background-faint text-xs uppercase` |

- [ ] **Step 3: `ArrowLink.astro` — 1 edit**

| Line | Old | New |
|---|---|---|
| 12 | `text: "transition-colors hover:bg-brown-400/10 focus-visible:bg-brown-400/10",` | `text: "transition-colors hover:bg-accent-faint/10 focus-visible:bg-accent-faint/10",` |

- [ ] **Step 4: `cv.astro` — 16 edits**

Every `brown-*` class becomes a semantic one. Apply exactly:

| Line | Old fragment | New fragment |
|---|---|---|
| 62 | `font-label text-brown-500 text-xs` | `font-label text-on-background-faint text-xs` |
| 72 | `text-brown-600 mt-7 max-w-2xl` | `text-on-background-muted mt-7 max-w-2xl` |
| 82 | `font-label text-brown-600 flex items-center` | `font-label text-on-background-muted flex items-center` |
| 112 | `text-brown-600 hover:text-primary focus-visible:text-primary` (email link) | `text-on-background-muted hover:text-primary focus-visible:text-primary` |
| 122 | `text-brown-600 hover:text-primary focus-visible:text-primary` (tel link) | `text-on-background-muted hover:text-primary focus-visible:text-primary` |
| 137 | `text-brown-600 hover:text-primary focus-visible:text-primary` (github link) | `text-on-background-muted hover:text-primary focus-visible:text-primary` |
| 195 | `index === 0 ? "bg-primary/85" : "bg-brown-200/85",` | `index === 0 ? "bg-primary/85" : "bg-accent-soft/85",` |
| 207 | `font-headline text-brown-800 sm:text-22` (experience h3) | `font-headline text-primary sm:text-22` |
| 210 | `font-label text-brown-500 shrink-0 text-sm` (experience period) | `font-label text-on-background-faint shrink-0 text-sm` |
| 214 | `font-label text-brown-500 mt-2 text-sm` (company) | `font-label text-on-background-faint mt-2 text-sm` |
| 217 | `text-brown-700 mt-4 max-w-3xl` (summary) | `text-on-background-variant mt-4 max-w-3xl` |
| 221 | `text-brown-700 marker:text-brown-500 mt-4 list-outside` (highlights ul) | `text-on-background-variant marker:text-on-background-faint mt-4 list-outside` |
| 228 | `font-label text-brown-500 text-xs font-medium` (stack dt) | `font-label text-on-background-faint text-xs font-medium` |
| 231 | `text-brown-600 text-sm leading-relaxed` (stack dd) | `text-on-background-muted text-sm leading-relaxed` |
| 258 | `font-headline text-brown-800 sm:text-22` (education h3) | `font-headline text-primary sm:text-22` |
| 261 + 265 | `font-label text-brown-500 …` (education period + degree) | `font-label text-on-background-faint …` |

- [ ] **Step 5: Verify — grep gate + parity**

```bash
rg -n "brown-" src --glob '!src/styles/global.css'
```

Expected: **no output** (exit code 1). If anything prints, sweep it too.

```bash
pnpm check && pnpm exec eslint . && pnpm exec prettier . --check && pnpm build
```

Then in the dev server: sepia must look pixel-identical to `master` (the new tokens resolve to the same browns via `var()` indirection), and flipping `data-theme` in DevTools re-skins every page including the CV.

- [ ] **Step 6: Commit**

```bash
git add src/pages/cv.astro src/components/Hero.astro src/components/PostCard.astro src/components/ArrowLink.astro
git commit -m "refactor: replace palette utilities with semantic theme tokens"
```

---

### Task 3: Flash-free persisted theme in `Layout.astro`

**Files:**
- Modify: `src/layouts/Layout.astro`

**Interfaces:**
- Consumes: the `html[data-theme]` blocks from Task 1; localStorage key `"theme"` with values `sepia | light | dark` (also written by Task 4's switcher).
- Produces: `<html>` always carrying a valid `data-theme` before first paint. Task 4's script reads `document.documentElement.dataset.theme` for radio sync.

- [ ] **Step 1: Server-render the default attribute**

In `src/layouts/Layout.astro` line 23, change:

```html
<html lang="en" class="scroll-smooth antialiased">
```

to:

```html
<html lang="en" data-theme="sepia" class="scroll-smooth antialiased">
```

- [ ] **Step 2: Add the inline restore script as the first child of `<head>`**

Directly after `<head>` (line 24), before the `<meta charset>` line, insert:

```html
    <script is:inline>
      // Restore the saved theme before first paint — no flash of the wrong
      // theme (spec §1). Invalid or missing values fall back to sepia;
      // blocked storage (private mode) falls back to sepia too.
      try {
        var t = localStorage.getItem("theme");
        document.documentElement.dataset.theme =
          ["sepia", "light", "dark"].indexOf(t) === -1 ? "sepia" : t;
      } catch (e) {
        document.documentElement.dataset.theme = "sepia";
      }
    </script>
```

`is:inline` is required so Astro emits the script verbatim in place instead of bundling it (a bundled module would run after paint).

- [ ] **Step 3: Verify — persistence, fallbacks, FOUC**

```bash
pnpm check && pnpm exec eslint . && pnpm exec prettier . --check && pnpm build
```

In the dev server:

1. DevTools → Application → Local Storage → set `theme` = `dark`, reload → page paints dark immediately (no sepia flash; verify with Network throttling "Slow 4G" + reload and watch the first frame).
2. Set `theme` = `garbage`, reload → sepia.
3. Delete the key, reload → sepia.
4. In DevTools → Application → Storage → check "Block storage" (or run `Object.defineProperty`… if unavailable, skip — the try/catch path is code-reviewed), reload → sepia, no console error.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat: restore persisted theme before first paint"
```

---

### Task 4: `ThemeSwitcher` component and header integration

**Files:**
- Create: `src/components/ThemeSwitcher.astro`
- Modify: `src/components/Header.astro`

**Interfaces:**
- Consumes: `dataset.theme` + localStorage key `"theme"` (Task 3), class `theme-anim` (Task 1).
- Produces: `ThemeSwitcher.astro` default export (used by `Header.astro`); a `<fieldset data-theme-switcher>` that Task 6 hides in print.

- [ ] **Step 1: Create `src/components/ThemeSwitcher.astro`**

```astro
---
// Segmented theme control (spec §2). Native radios give arrow-key
// navigation, tabbing and aria-checked semantics for free; the styled
// labels are the visible segments and reflect checked state via
// peer-checked utilities — no JS state mirroring for the visuals.
const themes = [
  { value: "sepia", label: "Sepia theme" },
  { value: "light", label: "Light theme" },
  { value: "dark", label: "Dark theme" },
] as const;

const icons: Record<(typeof themes)[number]["value"], string> = {
  // Droplet — nods at the tinted paper theme (and the --color-drop token).
  sepia: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z"></path>',
  light:
    '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>',
  dark: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>',
};
---

<fieldset
  data-theme-switcher
  class="border-outline-variant bg-surface m-0 flex items-center gap-0.5 rounded-full border p-0.5"
>
  <legend class="sr-only">Theme</legend>
  {
    themes.map(({ value, label }) => (
      <label class="cursor-pointer">
        <input
          type="radio"
          name="theme"
          value={value}
          class="peer sr-only"
          checked={value === "sepia"}
        />
        <span
          class="text-on-background-muted peer-checked:bg-surface-strong peer-checked:text-primary peer-focus-visible:ring-primary flex size-7 items-center justify-center rounded-full transition-colors peer-focus-visible:ring-2"
          title={label}
        >
          <svg
            aria-hidden="true"
            class="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            set:html={icons[value]}
          />
          <span class="sr-only">{label}</span>
        </span>
      </label>
    ))
  }
</fieldset>

<script>
  // Sync the checked radio to whatever the inline head script restored,
  // then apply + persist manual changes (spec §2).
  const root = document.documentElement;
  const group = document.querySelector<HTMLFieldSetElement>(
    "[data-theme-switcher]",
  );

  if (group) {
    const radios = group.querySelectorAll<HTMLInputElement>(
      "input[name='theme']",
    );
    for (const radio of radios) {
      radio.checked = radio.value === root.dataset.theme;
    }

    group.addEventListener("change", (event) => {
      const value = (event.target as HTMLInputElement).value;
      // Animate only while the swap happens, so per-element transition
      // utilities are untouched the rest of the time (see global.css).
      root.classList.add("theme-anim");
      root.dataset.theme = value;
      window.setTimeout(() => root.classList.remove("theme-anim"), 250);
      try {
        localStorage.setItem("theme", value);
      } catch {
        // Storage blocked (private mode): theme applies, just not saved.
      }
    });
  }
</script>
```

- [ ] **Step 2: Integrate into `Header.astro`**

Add the import at the top of the frontmatter:

```astro
import ThemeSwitcher from "./ThemeSwitcher.astro";
```

Replace the header body (lines 14–30) with — nav and switcher grouped so `justify-between` keeps Logo | (nav + switcher):

```astro
<header>
  <div class="container-page flex h-16 items-center justify-between lg:h-20">
    <Logo />
    <div class="flex items-center gap-5 lg:gap-gutter">
      <nav
        aria-label="Primary"
        class="text-primary lg:gap-gutter flex items-center gap-5 font-medium"
      >
        {
          links.map(({ href, label }) => (
            <a class={linkClass} href={href}>
              {label}
            </a>
          ))
        }
      </nav>
      <ThemeSwitcher />
    </div>
  </div>
</header>
```

(The nav keeps its exact original class list — it still lays out its own links; the new wrapper only adds the gap between nav and switcher.)

- [ ] **Step 3: Verify — switching, persistence, a11y, responsive**

```bash
pnpm check && pnpm exec eslint . && pnpm exec prettier . --check && pnpm build
```

In the dev server:

1. Click each segment on `/` and `/cv`: site re-skins with a ~200ms color fade (not instant, not a layout shift); active segment shows elevated bg + primary icon.
2. Reload after picking dark → stays dark, no flash; new tab keeps it.
3. Keyboard: `Tab` reaches the group (one stop), `Arrow Down/Right` cycles themes; focus ring visible on the focused segment.
4. DevTools → Rendering → "Emulate prefers-reduced-motion: reduce" → switching is instant (no fade).
5. Responsive mode 375px: Logo, nav links, and switcher fit on one row without wrapping or overflow.
6. Screen-reader quick pass (VoiceOver, `Ctrl+Opt+U`): "Theme, radio group, 3 items" with the checked item reported.

- [ ] **Step 4: Commit**

```bash
git add src/components/ThemeSwitcher.astro src/components/Header.astro
git commit -m "feat: add theme switcher to header"
```

---

### Task 5: CV data module + download button

**Files:**
- Create: `src/data/cv.ts`
- Modify: `src/pages/cv.astro`

**Interfaces:**
- Consumes: semantic token classes (Task 2).
- Produces: `src/data/cv.ts` exports `profile: CvProfile`, `experience: CvExperienceEntry[]`, `education: CvEducationEntry[]` (types below) — the single source of truth for current and future CV outputs. `cv.astro` also gains `break-inside-avoid` on entries/address and a `no-print` button hook that Task 6's stylesheet consumes.

- [ ] **Step 1: Create `src/data/cv.ts`**

```ts
// Single source of truth for CV content (spec §3). The CV page and the
// print/PDF output both render from these values — edit here only.

export interface CvContact {
  kind: "email" | "phone" | "github";
  href: string;
  label: string;
}

export interface CvProfile {
  name: string;
  role: string;
  summary: string;
  openToOpportunities: boolean;
  contacts: CvContact[];
}

export interface CvExperienceEntry {
  title: string;
  company: string;
  period: string;
  summary: string;
  highlights: string[];
  stack: string[];
}

export interface CvEducationEntry {
  institution: string;
  degree: string;
  period: string;
}

export const profile: CvProfile = {
  name: "Huan Tran Dinh",
  role: "Front end developer",
  summary:
    "Software engineer interested in building considered digital experiences, useful tools, and the systems that make them last.",
  openToOpportunities: true,
  contacts: [
    { kind: "email", href: "mailto:tdhuan013@gmail.com", label: "tdhuan013@gmail.com" },
    { kind: "phone", href: "tel:+84962468571", label: "0962 468 571" },
    { kind: "github", href: "https://github.com/tdhuan", label: "github.com/tdhuan" },
  ],
};

export const experience: CvExperienceEntry[] = [
  {
    title: "Software Engineer",
    company: "Camelo",
    period: "05/2021 — 03/2026",
    summary:
      "Contributed to the development and continued improvement of Camelo’s web product and customer-facing sites.",
    highlights: [
      "Helped evolve the web application from its early stages into a production product.",
      "Collaborated with designers to deliver features end to end, from planning and implementation through testing and release",
      "Built reusable, responsive interface patterns and documented them in Storybook for the team.",
      "Implemented data-driven interface flows using React and GraphQL.",
      "Investigated and resolved bugs in the web app.",
      "Supported teammates with implementation questions and day-to-day development work.",
    ],
    stack: [
      "TypeScript",
      "React",
      "Next.js",
      "GraphQL",
      "Tailwind CSS",
      "Headless UI",
      "TanStack Query",
      "React Hook Form",
      "Storybook",
    ],
  },
  {
    title: "Front End Engineer",
    company: "Sutrix Solution",
    period: "12/2020 — 05/2021",
    summary:
      "Contributed to the development and continued improvement of Camelo’s web product and customer-facing sites.",
    highlights: [
      "Helped evolve the web application from its early stages into a production product.",
      "Collaborated with designers to deliver features end to end, from planning and implementation through testing and release",
    ],
    stack: ["React, Redux"],
  },
];

export const education: CvEducationEntry[] = [
  {
    institution: "VNUHCM - University of Science",
    degree: "Bachelor's degree, Information Technology",
    period: "2015 — 2019",
  },
];
```

- [ ] **Step 2: Rewire `cv.astro` frontmatter**

Replace the entire frontmatter block (lines 1–52, the `experience` and `education` consts) with:

```astro
---
import Layout from "@/layouts/Layout.astro";
import { education, experience, profile } from "@/data/cv";

const contactIcons: Record<"email" | "phone" | "github", string> = {
  email:
    '<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.74a16 16 0 0 0 6 6l1.28-1.28a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z"></path>',
  github:
    '<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.54 1.04 1.54 1.04.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.55 9.55 0 0 1 12 6.8c.85 0 1.7.11 2.5.34 1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.91.68 1.84v2.73c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" fill="currentColor" stroke="none"></path>',
};
---
```

(The contact `<a>` elements then render via `profile.contacts.map`, embedding `set:html={contactIcons[contact.kind]}` inside the existing svg markup — keep the svg wrapper attributes exactly as they are today.)

- [ ] **Step 3: Point the template at the module**

In the template: replace `{profile.role}`-equivalent literals — i.e. the eyebrow text becomes `{profile.role}`, the `h1` becomes `{profile.name}`, the intro `<p>` becomes `{profile.summary}`, the contacts block maps `profile.contacts` (`{contact.label}`, `href={contact.href}`, icon via `contactIcons[contact.kind]`), and the "Open to opportunities" `<p>` wraps in `{profile.openToOpportunities && (…)}`. The experience/education `.map(...)` bodies keep their current markup and Task 2 class names — only the source arrays change (they already have identical shapes).

- [ ] **Step 4: Replace "View experience" with the download button**

Replace the whole anchor block (today lines 88–106, the `<a href="#experience">` with the down-arrow svg) with:

```astro
            <button
              type="button"
              data-print-cv
              title="Opens the print dialog — choose “Save as PDF”"
              class="font-label border-primary/40 text-primary hover:border-primary focus-visible:border-primary no-print inline-flex items-center gap-2 border-b px-0 py-1 text-xs font-medium transition-colors"
            >
              Download CV
              <svg
                aria-hidden="true"
                class="size-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 15V3"></path>
                <path d="m7 10 5 5 5-5"></path>
                <path d="M19 21H5"></path>
              </svg>
            </button>
```

Same visual language as the old link (underline border, label font, arrow), so the header row's rhythm is unchanged.

- [ ] **Step 5: Add the print script and page-break classes**

At the end of `cv.astro`, append:

```astro
<script>
  // Download = browser print dialog with the light print stylesheet (spec §5).
  document.querySelector("[data-print-cv]")?.addEventListener("click", () => {
    window.print();
  });
</script>
```

Add Tailwind's built-in `break-inside-avoid` to: each experience `<li>` (line 187: `class="flex gap-4 sm:gap-6"` → `class="flex gap-4 break-inside-avoid sm:gap-6"`) and the `<address>` (line 110: append ` break-inside-avoid`). These are no-ops on screen and only matter in paged media (Task 6 verifies).

- [ ] **Step 6: Verify**

```bash
pnpm check && pnpm exec eslint . && pnpm exec prettier . --check && pnpm build
```

In the dev server on `/cv`: page renders identically to before (data now from the module); "Download CV" opens the print dialog (print styling itself lands in Task 6 — expect unstyled print for now); `rg -n "View experience" src` → no output.

- [ ] **Step 7: Commit**

```bash
git add src/data/cv.ts src/pages/cv.astro
git commit -m "feat: extract cv data module and add download button"
```

---

### Task 6: Print stylesheet — forced light output

**Files:**
- Create: `src/styles/print.css`
- Modify: `src/layouts/Layout.astro` (import)
- Modify: `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/BackToTop.astro`, `src/components/ThemeSwitcher.astro` (`no-print`)

**Interfaces:**
- Consumes: `--light-*` raw properties (Task 1), `.no-print` convention + `[data-print-cv]` + `break-inside-avoid` (Task 5).
- Produces: identical light A4 print/PDF output from any active theme.

- [ ] **Step 1: Create `src/styles/print.css`**

```css
/*
 * Print output (spec §4): always the light theme, regardless of the
 * visitor's active data-theme. Maps the semantic tokens to the same
 * --light-* raw values used by html[data-theme="light"] in global.css,
 * so screen-light and paper-light can never drift apart.
 */

@media print {
  :root {
    color-scheme: light;
    --color-background: var(--light-background);
    --color-on-background: var(--light-on-background);
    --color-on-background-variant: var(--light-on-background-variant);
    --color-on-background-muted: var(--light-on-background-muted);
    --color-on-background-faint: var(--light-on-background-faint);
    --color-surface: var(--light-surface);
    --color-on-surface: var(--light-on-surface);
    --color-primary: var(--light-primary);
    --color-on-primary: var(--light-on-primary);
    --color-secondary: var(--light-secondary);
    --color-on-secondary: var(--light-on-secondary);
    --color-inverse-surface: var(--light-inverse-surface);
    --color-inverse-on-surface: var(--light-inverse-on-surface);
    --color-drop: var(--light-drop);
    --color-surface-subtle: var(--light-surface-subtle);
    --color-surface-muted: var(--light-surface-muted);
    --color-surface-elevated: var(--light-surface-elevated);
    --color-surface-strong: var(--light-surface-strong);
    --color-accent-soft: var(--light-accent-soft);
    --color-accent-faint: var(--light-accent-faint);
    --color-outline: var(--light-outline);
    --color-outline-variant: var(--light-outline-variant);
  }

  @page {
    size: A4;
    margin: 14mm;
  }

  /* Site chrome never belongs on paper. */
  .no-print {
    display: none !important;
  }

  .background-drop {
    display: none;
  }

  body {
    background: #ffffff;
  }

  /* Slightly compacted type for A4 (spec §4). */
  html {
    font-size: 15px;
  }

  main {
    padding-top: 0 !important;
  }
}
```

- [ ] **Step 2: Import it once in `Layout.astro`**

In the frontmatter, directly under `import "@/styles/global.css";`:

```astro
import "@/styles/print.css";
```

- [ ] **Step 3: Add `no-print` to the chrome**

- `Header.astro` root: `<header>` → `<header class="no-print">`
- `Footer.astro` root: `<footer class="border-outline-variant mt-gutter border-t">` → add ` no-print`
- `BackToTop.astro`: add `no-print` to both the sentinel `<div id="back-to-top-sentinel" class="absolute top-0 h-px" aria-hidden="true">` and the `<a id="back-to-top" …>` class list
- `ThemeSwitcher.astro` fieldset: append ` no-print` to the class list

(The download button already carries `no-print` from Task 5.)

- [ ] **Step 4: Verify — identical light print from every theme**

```bash
pnpm check && pnpm exec eslint . && pnpm exec prettier . --check && pnpm build
```

In the dev server on `/cv`, for **each** of sepia / light / dark: click "Download CV" → print preview shows the same output — light background tokens, white paper, no header/footer/switcher/back-to-top/noise/download button, A4 with 14mm margins, contact block and each experience entry unsplit across page breaks. Also spot-check `/` print preview: chrome hidden, content readable (no assertion on layout beyond "sane").

- [ ] **Step 5: Commit**

```bash
git add src/styles/print.css src/layouts/Layout.astro src/components/Header.astro src/components/Footer.astro src/components/BackToTop.astro src/components/ThemeSwitcher.astro
git commit -m "feat: force light print output and hide site chrome"
```

---

### Task 7: Full verification pass (spec §Verification)

**Files:**
- None (verification only; fix-forward on failures with a `fix:` commit).

- [ ] **Step 1: Commands**

```bash
pnpm check && pnpm exec eslint . && pnpm exec prettier . --check && pnpm build
```

Expected: all pass, zero errors.

- [ ] **Step 2: Contrast audit**

Run and confirm every ratio ≥ 4.5 (matches the Global Constraints table after any tuning done in Task 1):

```bash
node -e '
const L = h => { const c = [1,3,5].map(i => parseInt(h.substr(i,2),16)/255).map(v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4)); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; };
const r = (a,b) => { const [x,y]=[L(a),L(b)].sort((p,q)=>q-p); return ((x+0.05)/(y+0.05)).toFixed(2); };
const dark = { "on-background":"#ece4dd", "variant":"#c9b8ac", "muted":"#b09a8c", "faint":"#9e7a66", "primary":"#c9ad97" };
for (const [n,f] of Object.entries(dark)) console.log(n, r(f, "#171210"));
'
```

If Task 1 tuned any dark value, re-run with the shipped hexes.

- [ ] **Step 3: Manual matrix**

For each theme × each page (`/`, `/blog`, `/notes`, `/about`, `/cv`):

- [ ] Renders correctly; no unreadable text, no invisible borders, no leftover sepia-only assumptions (check PostCard hover wash, ArrowLink hover, CV timeline dots).
- [ ] Persistence: pick theme, reload, open new tab → kept. `theme=garbage` → sepia. Storage blocked → sepia, no console errors. JavaScript disabled (DevTools → Settings → Debugger "Disable JavaScript") → sepia renders fully, identical to `master`.
- [ ] FOUC: DevTools network throttle "Slow 4G" + reload on `/` with dark saved → first frame is dark.
- [ ] Switcher: keyboard tab + arrows cycle themes; focus ring visible; radiogroup semantics announced (VoiceOver); 375px width — one row, no overflow.
- [ ] Reduced motion (emulated): theme swap instant.
- [ ] Print from `/cv` in each theme → identical light A4; entries unsplit; chrome and button hidden.

- [ ] **Step 4: Report**

Report the matrix results (including the recorded contrast numbers) in the worktree summary. Fix-forward anything that fails, then re-run the affected row.

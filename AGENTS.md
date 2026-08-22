# AGENTS.md

Guidance for Claude Code and other coding agents working in this repository.

## Commands

Package manager is pnpm (workspace enabled via pnpm-workspace.yaml). Node >= 22.12.0.

- `pnpm dev` — start dev server (foreground, port 4321). For background mode: `pnpm astro dev --background`, managed via `pnpm astro dev stop` / `status` / `logs`. Background servers detach from the shell — if a port stays occupied, find the process with `lsof -nP -iTCP:4321 -sTCP:LISTEN` and kill it.
- `pnpm build` — production build
- `pnpm preview` — preview the built site
- `pnpm check` — type-check (`astro check`; there is no test suite)
- `pnpm exec eslint .` — lint
- `pnpm format` — format (`prettier . --write`); `pnpm format:check` to check only (Prettier plugins: astro, tailwindcss class sorting)

## Skills

When implementing UI:

- Use `frontend-ui-engineering` for visual design, component architecture,
  accessibility, responsive behavior, interaction patterns, and UI quality.

When implementing Astro-specific code:

- Use `astro-development` for Astro architecture and `.astro` components.
- Use `astro-content` for content collections, Markdown, MDX, and blog posts.
- Use `astro-routing` for pages, dynamic routes, redirects, middleware, and endpoints.
- Use `astro-assets` for images, fonts, SVGs, and asset optimization.
- Use `astro-performance` when the task affects hydration, JavaScript,
  Core Web Vitals, rendering, or bundle size.

## Architecture

Static Astro site (no SSR, no UI-framework integrations). Everything is `.astro` components:

- `src/pages/` — file-based routing (`index`, `blog`, `notes`, `about`, `cv`). `blog`/`notes` are placeholders; no content collections set up yet. `about` is a fully-built editorial page — hero plus hairline-divided sections; its copy lives directly in the page file (unlike the CV, which renders from `src/data/cv.ts`).
- `src/layouts/Layout.astro` — the single layout every page uses. Owns `<head>`, Google Fonts loading, the `Header`/`Footer` chrome, and the fixed noise `background-drop` layer. Takes `title`, `bodyClass`, `bodyStyle`, `mainClass` props.
- `src/components/` — shared Astro components. `SectionHeading` takes a `rule` prop (default `true`) for the trailing rule line — the CV keeps it, the About page passes `rule={false}` for plain headings.
- `src/data/cv.ts` — single source of truth for CV content; `cv.astro` renders it on screen and in print/PDF (the "Download" button opens the browser print dialog). Edit CV content here only.
- Imports use the `@/` alias for `src/*` (configured in tsconfig.json).

### Styling

Tailwind CSS v4 via the Vite plugin (no `tailwind.config` file). The design system lives as `@theme` tokens in `src/styles/global.css`, which is imported once in `Layout.astro`:

- Color tokens — palette (`--color-brown-*`), semantic (`--color-primary`, `--color-surface`, `--color-on-*`, ...), and surface hierarchy (`--color-surface-subtle/muted/elevated/strong`) — use these utilities (e.g. `text-on-background`, `bg-surface-muted`) instead of arbitrary color values.
- Layout tokens (`--container-page`, `--spacing-margin-*`, `--spacing-gutter`) — e.g. `max-w-page`, `px-margin-mobile lg:px-margin-desktop`.
- Font tokens (`--font-sans`, `--font-serif`, `--font-mono`) — Spline Sans / Newsreader / IBM Plex Mono, loaded from Google Fonts in `Layout.astro` (a new weight or variant must be added to that URL). `font-sans` is the site default (set on `<body>`); `font-serif` is for editorial headings only (Hero H1, PostCard titles, SectionHeading, CV headings); `font-mono` is for metadata (dates, periods, tags, uppercase kicker labels).

Theming: three themes — sepia (the default `:root` values), light, and dark — selected by `html[data-theme]`, which `ThemeSwitcher` persists to localStorage. Theme values live in three places that must stay in lockstep: the `:root --light-*` raws, the `html[data-theme="light"]`/`html[data-theme="dark"]` mapping blocks in `global.css`, and the `html:root` block in `print.css`. A token added or changed in one must reach all of them.

`src/styles/print.css` (also imported once in `Layout.astro`) is the print stylesheet; the CV page's print output is styled almost entirely through `print:` variants plus this file. The CV uses only two text colors on screen (`text-primary` for headings and accents, `text-on-background` everywhere else) and prints in a single ink (`#171717`) and a single font (`font-sans`).

UI conventions:

- Corner language is square: bordered controls use `rounded-none`; `rounded-full` is reserved for deliberate circles (theme pill, CV timeline dots). No `rounded-lg`/`rounded-xl` card containers.
- Floating layers (dropdowns, popovers) use the `bg-surface` + `border-outline-variant` recipe rather than shadows; attach full-width to the chrome they belong to.
- Hairline separation via `border-t` / `divide-y divide-outline-variant` (see Footer, Header's mobile menu); vertical hairlines via `divide-x` between columns (see About's work values) or an inset pseudo-element divider between paired panels (see About's "Things I enjoy" / "Outside of code" row).
- Nav links share the `after:` underline treatment (`after:w-0 hover:after:w-full`); the active page keeps `after:w-full` plus `aria-current="page"` (see Header).
- Keyboard focus: a global `:focus-visible` rule in `global.css` draws the outline (`2px solid var(--color-primary)`, offset 2px), theme-aware — components don't draw their own focus rings. Exception: a focusable `sr-only` input (ThemeSwitcher radios) can't show that outline; transfer it to the visible sibling with `peer-focus-visible:`.
- Interactive state: a small inline `<script>` per component, hooked to `data-*` attributes, with `aria-expanded`/`aria-checked` as the source of truth. When animation matters, toggle utility classes (`invisible`, `grid-rows-[0fr]`) instead of `hidden` — `visibility` keeps closed UI out of the tab order while transitions still run. Pair every transition with `motion-reduce:transition-none`.
- Breakpoints are mobile-first `sm:`/`lg:` pairs (`hidden sm:flex` with its matching `sm:hidden`). Custom type sizes only via px-named `--text-*` tokens (`text-56`), never `text-[56px]`; spacing stays on Tailwind's default scale.
- Class order is machine-managed: `prettier-plugin-tailwindcss` sorts it on format — never hand-align.

TypeScript uses the `astro/tsconfigs/strict` preset; ESLint parses `.astro` files with `astro-eslint-parser` + TypeScript parser.

## Development Workflow

For every new feature or non-trivial implementation:

1. Use the Superpowers `using-git-worktrees` skill before modifying code.
2. Work inside the isolated worktree created by that skill.
3. Never implement a new feature directly on the current working branch.
4. Follow the Superpowers workflow for:
   - brainstorming/planning
   - implementation
   - testing
   - review
5. Run the relevant tests, lint, and type checks before finishing
   (`pnpm check`, lint/format, `pnpm build`).
6. Do not merge or delete the worktree unless explicitly requested.

Before modifying code: inspect the existing structure, read relevant components
and patterns, reuse existing components and utilities, and follow the existing
architecture.

## Astro documentation

When an Astro API is uncertain or potentially version-dependent, consult the
Astro Docs MCP rather than relying on memory. Do not invent Astro APIs.

Full documentation: https://docs.astro.build

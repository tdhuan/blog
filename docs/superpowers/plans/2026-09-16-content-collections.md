# Content Collections (Blog, Notes, TIL) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `blog`/`notes` placeholder pages with three Astro content collections (`blog`, `notes`, `til`), each with a list page, detail pages, shared rendering components, and a homepage wired to the latest posts.

**Architecture:** Three separate collections defined in `src/content.config.ts` via `glob()` loaders over `src/content/<name>/**/*.md` with Zod schemas (spec "Approach A"). Three thin `[id].astro` routes delegate all detail markup to one shared `ArticlePage` component; list pages and the homepage share a draft-filter/sort helper. Reading time is computed at build from the raw Markdown body. No new dependencies — prose styling is a hand-rolled, token-based `.prose-article` block in `global.css`.

**Tech Stack:** Astro 7.1.6 (static output, content layer API: `defineCollection`/`glob`/`getCollection`/`render` from `astro:content`, `z` from `astro/zod`), Tailwind CSS v4 (`@theme` tokens in `src/styles/global.css`), TypeScript strict preset, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-16-content-collections-design.md`

## Global Constraints

- Node >= 22.12.0; package manager is pnpm. **No new dependencies** — no `@tailwindcss/typography`, no reading-time library, no test framework (the spec's verification is `pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm build`, and dev-server click-throughs).
- Work in an isolated worktree created via the superpowers:using-git-worktrees skill (required by CLAUDE.md before modifying code). Do not merge or delete the worktree unless asked.
- Design tokens only — never arbitrary color values; use `text-primary`, `text-on-background-muted`, `bg-surface-muted`, `border-outline-variant`, etc. Colors in raw CSS use `var(--color-*)` tokens, which resolve per theme automatically.
- Tailwind class order is machine-managed (`prettier-plugin-tailwindcss` runs via lint-staged on commit) — write classes in any order, never hand-align.
- Corner language is square (`rounded-none`); hairline separation via `divide-y divide-outline-variant/30`; metadata (dates, tags, kickers) in `font-mono`; editorial headings in `font-serif`; body text `font-sans` (site default on `<body>`).
- Imports use the `@/` alias for `src/*` (e.g. `@/utils/collection`).
- `import type { ... }` for type-only imports.
- Commit messages: conventional commits (`feat:`, `docs:`), one commit per task, staged explicitly by path (never `git add -A`; there is an untracked `.codex/` directory that must not be committed).
- Entry IDs are slugified filenames and **are** the URLs: `src/content/blog/container-queries.md` → `/blog/container-queries`. Keep seed filenames kebab-case.
- Dates in this plan are absolute (today is 2026-09-16); seed `pubDate` values are chosen around Aug–Sep 2026.

---

### Task 1: Content collections config + seed entries

**Files:**

- Create: `src/content.config.ts`
- Create: `src/content/blog/container-queries.md`
- Create: `src/content/blog/astro-content-collections.md` (this one is a draft)
- Create: `src/content/notes/on-small-tools.md`
- Create: `src/content/notes/slow-mornings.md`
- Create: `src/content/til/astro-zod-import.md`
- Create: `src/content/til/git-word-diff.md`

**Interfaces:**

- Consumes: nothing (first task).
- Produces: collections `blog`, `notes`, `til` queryable via `getCollection("blog" | "notes" | "til")` (used from Task 2 on). Frontmatter shape: `title: string`, `pubDate: Date`, `tags: string[]` (default `[]`), `draft: boolean` (default `false`), `description: string` (required in `blog`, optional elsewhere).

- [ ] **Step 1: Create `src/content.config.ts`**

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const baseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  pubDate: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  // Blog posts always carry a description (used on cards and lists).
  schema: baseSchema.extend({ description: z.string() }),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
  schema: baseSchema,
});

const til = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/til" }),
  schema: baseSchema,
});

export const collections = { blog, notes, til };
```

- [ ] **Step 2: Create the seed content files**

`src/content/blog/container-queries.md` (long enough to produce a reading time ≥ 2 min; exercises headings, lists, code, blockquote, links so Task 6's prose styles have something to style):

````md
---
title: "A practical guide to container queries in CSS"
description: "Moving beyond media queries for truly modular components. Everything you need to start building responsive layouts the right way."
pubDate: 2026-09-08
tags: ["css", "engineering"]
---

Media queries ask the browser one question: how wide is the viewport? That was
enough when pages were one fixed column of content. It stops being enough the
moment a component can appear in different contexts — a card in a wide feed, the
same card in a sidebar, the same card in a grid cell that spans two columns.

A container query asks a better question: how much room does _this component_
have? The answer belongs to the component, not the page.

## The two pieces

There are exactly two things to learn. The first declares which element is the
query container:

```css
.card-wrapper {
  container-type: inline-size;
}
```

The second asks it questions, with syntax that mirrors media queries:

```css
@container (min-width: 32rem) {
  .card {
    display: grid;
    grid-template-columns: 8rem 1fr;
  }
}
```

`inline-size` is the value you want almost always: it applies containment
along the inline axis and skips the layout-feedback loops you'd risk with full
size containment.

## Why this changes how you write CSS

With media queries, responsive rules for one widget end up smeared across a
stylesheet that knows about the page's breakpoints. The widget cannot be moved
without re-auditing every query that mentions it.

With container queries, the rules live with the component:

- A card restyles itself when its own width crosses a threshold.
- The same card works in the main column, a sidebar, or a dialog — no overrides.
- Breakpoints stop being page-wide magic numbers owned by nobody.

> A component that adapts to its own container is a component you can drop
> anywhere. That is the whole pitch, and it delivers.

## Naming containers

When several containers are in play, name them to be explicit about who is
being asked:

```css
.sidebar {
  container: sidebar / inline-size;
}

@container sidebar (min-width: 24rem) {
  .sidebar .toc {
    display: block;
  }
}
```

Unnamed queries resolve to the nearest ancestor container; named ones let a
rule target a specific ancestor, which matters in deeply nested layouts.

## Where support stands

Container queries have shipped in every major browser since 2023, and the
related units (`cqw`, `cqh`, `cqi`) ship with them. The honest caveat is
tooling: some older CSS-in-JS setups and minifiers mangle unknown at-rules, so
verify your build pipeline passes `@container` through untouched.

## A rule of thumb

Use media queries for page-level decisions (does the nav collapse? is this a
touch device?). Use container queries for component-level decisions (does this
card have room for a side image?). If you keep that split, each mechanism stays
simple, and your components stop knowing things about pages they have never
met.
````

`src/content/blog/astro-content-collections.md` — the draft entry (its `pubDate` is the newest of all seeds; it must be visible in dev but absent from production output — this is the draft-behavior probe used in Task 8):

```md
---
title: "Modeling content with Astro content collections"
description: "How this site's blog, notes, and TIL sections are defined as typed collections."
pubDate: 2026-09-12
tags: ["astro"]
draft: true
---

Astro's content layer lets a site like this define its content as typed
collections: a config file declares where entries live and what shape their
frontmatter has, and every page then queries the store with full type safety.

The pieces are small. A `glob()` loader points at a directory of Markdown
files. A Zod schema states the contract — this collection has a required
description, that one doesn't. From then on, a malformed file fails the build
by name and field, which is exactly the failure mode you want from a static
site.

This post is itself a `draft: true` entry: visible while writing, excluded
from the built site, no flag to remember at deploy time.
```

`src/content/notes/on-small-tools.md` (short — no reading time should render):

```md
---
title: "On small tools"
pubDate: 2026-08-20
tags: ["tools"]
---

I keep coming back to the same realization: the tools that stick around are
the ones that do one narrow thing without asking questions. A script that
resizes images. A makefile target that rebuilds the site. They don't want an
account, they don't want to be a platform, they don't announce a roadmap.

Big tools solve problems I don't have yet. Small tools solve the problem I
have today, and then quietly keep solving it for years.
```

`src/content/notes/slow-mornings.md`:

```md
---
title: "Slow mornings"
pubDate: 2026-07-15
tags: ["life"]
---

The best change I made to my mornings wasn't waking up earlier — it was
refusing to open anything with a feed until after breakfast. The news is the
same at 9 as it was at 7. The first hour of the day turns out to be the only
one that reliably belongs to me.
```

`src/content/til/astro-zod-import.md`:

```md
---
title: "Zod comes from astro/zod"
pubDate: 2026-09-10
tags: ["astro"]
---

When defining content collection schemas, `z` is imported from `astro/zod`,
not from a separately installed zod package. Astro re-exports it so schemas and
the runtime that validates them can never drift apart.
```

`src/content/til/git-word-diff.md`:

```md
---
title: "git diff has a word mode"
pubDate: 2026-08-02
tags: ["git"]
---

`git diff --word-diff` highlights changed words inside a changed line instead
of showing the whole line as rewritten. Indispensable for prose and long
commit messages where one word moved.
```

- [ ] **Step 3: Run the build to verify config + frontmatter validate**

Run: `pnpm build`
Expected: build succeeds; content layer syncs `.astro/types.d.ts` with no Zod errors.

- [ ] **Step 4: Negative check — invalid frontmatter must fail the build (red/green probe)**

Temporarily edit `src/content/notes/on-small-tools.md`: change `pubDate: 2026-08-20` to `pubDate: "not-a-date"`.
Run: `pnpm build`
Expected: FAIL — a Zod error naming the file (`on-small-tools`) and the invalid field.
Then restore `pubDate: 2026-08-20` and confirm `pnpm build` passes again.

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/content/blog src/content/notes src/content/til
git commit -m "feat: add blog, notes, til content collections with seed entries"
```

---

### Task 2: Query + reading-time utils

**Files:**

- Create: `src/utils/collection.ts`
- Create: `src/utils/reading-time.ts`

**Interfaces:**

- Consumes: the `blog`/`notes`/`til` collections from Task 1.
- Produces (used by Tasks 3–7):
  - `type SectionKey = "blog" | "notes" | "til"` (from `@/utils/collection`)
  - `function getPublishedEntries<C extends SectionKey>(collection: C): Promise<CollectionEntry<C>[]>` — filters `draft: true` when `import.meta.env.PROD`, sorts by `pubDate` descending.
  - `function readingMinutes(body: string | null | undefined): number | null` — `ceil(words / 200)`; `null` when the result would be under 2.

- [ ] **Step 1: Create `src/utils/collection.ts`**

```ts
import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

export type SectionKey = "blog" | "notes" | "til";

/**
 * Draft-filtered, pubDate-descending entries for a section.
 * Drafts are visible in dev and excluded from production builds.
 */
export async function getPublishedEntries<C extends SectionKey>(
  collection: C,
): Promise<CollectionEntry<C>[]> {
  // The generated getCollection overloads key on literal collection names;
  // calling with a generic union needs this type-level cast (runtime is fine).
  const entries = (await getCollection(collection)) as CollectionEntry<C>[];
  const visible = import.meta.env.PROD
    ? entries.filter((entry) => !entry.data.draft)
    : entries;
  return visible.sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );
}
```

- [ ] **Step 2: Create `src/utils/reading-time.ts`**

```ts
/**
 * Reading time for a raw Markdown body. ~200 wpm is the usual
 * silent-reading estimate; under two minutes isn't worth a label.
 */
export function readingMinutes(body: string | null | undefined): number | null {
  if (!body) {
    return null;
  }
  const words = body.split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / 200);
  return minutes >= 2 ? minutes : null;
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm check`
Expected: no errors. (`import.meta.env` resolves via `.astro/types.d.ts`, already in tsconfig `include`; `astro check` re-syncs it.)

- [ ] **Step 4: Commit**

```bash
git add src/utils/collection.ts src/utils/reading-time.ts
git commit -m "feat: add collection query and reading-time utils"
```

---

### Task 3: PostCard props refactor + homepage wiring

**Files:**

- Modify: `src/components/PostCard.astro` (full rewrite — was hardcoded demo markup)
- Modify: `src/pages/index.astro` (full rewrite of frontmatter + posts section)

**Interfaces:**

- Consumes: `getPublishedEntries`, `readingMinutes` (Task 2).
- Produces: `PostCard` with `interface Props { title: string; href: string; pubDate: Date; description?: string; kicker?: string; readingMinutes?: number | null }` — used by Tasks 4 and 5.

- [ ] **Step 1: Rewrite `src/components/PostCard.astro`**

```astro
---
interface Props {
  title: string;
  href: string;
  pubDate: Date;
  description?: string;
  kicker?: string;
  readingMinutes?: number | null;
}

const {
  title,
  href,
  pubDate,
  description,
  kicker,
  readingMinutes: minutes,
} = Astro.props;

const dateLabel = pubDate.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
---

<a class="block" href={href}>
  <article
    class="group gap-gutter hover:bg-accent-soft/10 flex flex-col items-start px-3 py-10 md:flex-row md:py-12"
  >
    {
      kicker && (
        <div class="w-32 shrink-0 pt-1">
          <span class="text-on-background-faint font-mono text-xs uppercase">
            {kicker}
          </span>
        </div>
      )
    }
    <div class="text-primary grow">
      <h3
        class="group-hover:text-on-background-faint mb-3 font-serif text-2xl leading-tight font-semibold transition-colors md:text-3xl"
      >
        {title}
      </h3>
      {
        description && (
          <p class="max-w-2xl font-sans text-sm lg:text-base">{description}</p>
        )
      }
    </div>
    <div
      class="text-primary flex w-full flex-row justify-between gap-4 pt-1 md:w-auto md:flex-col md:items-end md:text-right"
    >
      <time class="font-mono text-xs" datetime={pubDate.toISOString()}>
        {dateLabel}
      </time>
      {minutes != null && <span class="font-mono text-xs">{minutes} min</span>}
    </div>
  </article>
</a>
```

Notes for the implementer: the whole card is now the link (`<a class="block">` wrapping the unchanged article layout, so it stays a direct child of the pages' `divide-y` wrapper). Kicker column and reading time render only when provided — untagged TIL entries get a compact row. Don't hand-sort the classes; the pre-commit prettier pass sorts them.

- [ ] **Step 2: Rewrite `src/pages/index.astro`**

```astro
---
import { getPublishedEntries } from "@/utils/collection";
import { readingMinutes } from "@/utils/reading-time";
import ArrowLink from "@/components/ArrowLink.astro";
import Hero from "@/components/Hero.astro";
import PostCard from "@/components/PostCard.astro";
import Layout from "@/layouts/Layout.astro";

const posts = (await getPublishedEntries("blog")).slice(0, 3);
---

<Layout>
  <Hero />
  {
    posts.length > 0 && (
      <section class="container-page sm:pt-12 sm:pb-32">
        <div class="divide-outline-variant/30 flex flex-col divide-y">
          {posts.map((post) => (
            <PostCard
              title={post.data.title}
              href={`/blog/${post.id}`}
              pubDate={post.data.pubDate}
              description={post.data.description}
              kicker={post.data.tags[0]}
              readingMinutes={readingMinutes(post.body)}
            />
          ))}
          <div class="flex justify-center pt-12">
            <ArrowLink href="/blog">Read all posts</ArrowLink>
          </div>
        </div>
      </section>
    )
  }
</Layout>
```

(Zero posts → the whole section is omitted, per spec.)

- [ ] **Step 3: Type-check and verify rendering**

Run: `pnpm check` — expected: no errors.
Run: `pnpm astro dev --background` then `curl -s http://localhost:4321/ | grep -c "A practical guide"` — expected: `1` or more (the non-draft blog seed renders).

Note: card links point at `/blog/<id>`, which 404s until Task 7 adds the detail routes — verifying card rendering only at this stage. Leave the dev server running for later tasks (`pnpm astro dev logs` / `stop`).

- [ ] **Step 4: Commit**

```bash
git add src/components/PostCard.astro src/pages/index.astro
git commit -m "feat: render latest blog posts on homepage"
```

---

### Task 4: Blog list page

**Files:**

- Modify: `src/pages/blog.astro` (replace the placeholder)

**Interfaces:**

- Consumes: `getPublishedEntries`, `readingMinutes` (Task 2), `PostCard` props (Task 3), `SectionHeading` (existing — requires `id: string`, optional `rule: boolean`, default `true`).
- Produces: the `/blog` list route.

- [ ] **Step 1: Replace `src/pages/blog.astro`**

```astro
---
import { getPublishedEntries } from "@/utils/collection";
import { readingMinutes } from "@/utils/reading-time";
import PostCard from "@/components/PostCard.astro";
import SectionHeading from "@/components/SectionHeading.astro";
import Layout from "@/layouts/Layout.astro";

const posts = await getPublishedEntries("blog");
---

<Layout title="Blog | Huan Tran">
  <section class="container-page py-16 sm:py-24">
    <SectionHeading id="blog">Blog</SectionHeading>
    {
      posts.length === 0 ? (
        <p class="text-on-background-muted pt-10 font-sans">
          Nothing here yet.
        </p>
      ) : (
        <div class="divide-outline-variant/30 mt-10 flex flex-col divide-y">
          {posts.map((post) => (
            <PostCard
              title={post.data.title}
              href={`/blog/${post.id}`}
              pubDate={post.data.pubDate}
              description={post.data.description}
              kicker={post.data.tags[0]}
              readingMinutes={readingMinutes(post.body)}
            />
          ))}
        </div>
      )
    }
  </section>
</Layout>
```

- [ ] **Step 2: Verify**

Run: `pnpm check` — expected: no errors.
Run: `curl -s http://localhost:4321/blog | grep -c "A practical guide"` — expected: `1` or more. No "Read all posts" link on this page (reader is already here).

- [ ] **Step 3: Commit**

```bash
git add src/pages/blog.astro
git commit -m "feat: render blog list from content collection"
```

---

### Task 5: Notes + TIL list pages, TIL nav item

**Files:**

- Modify: `src/pages/notes.astro` (replace the placeholder)
- Create: `src/pages/til.astro`
- Modify: `src/components/Header.astro:5-10` (the `links` array only)

**Interfaces:**

- Consumes: same as Task 4.
- Produces: `/notes` and `/til` list routes; nav contains `{ href: "/til", label: "TIL" }`.

- [ ] **Step 1: Replace `src/pages/notes.astro`**

```astro
---
import { getPublishedEntries } from "@/utils/collection";
import { readingMinutes } from "@/utils/reading-time";
import PostCard from "@/components/PostCard.astro";
import SectionHeading from "@/components/SectionHeading.astro";
import Layout from "@/layouts/Layout.astro";

const posts = await getPublishedEntries("notes");
---

<Layout title="Notes | Huan Tran">
  <section class="container-page py-16 sm:py-24">
    <SectionHeading id="notes">Notes</SectionHeading>
    <p class="text-on-background-muted mt-4 max-w-2xl font-sans">
      Short, informal posts — thoughts in progress.
    </p>
    {
      posts.length === 0 ? (
        <p class="text-on-background-muted pt-10 font-sans">
          Nothing here yet.
        </p>
      ) : (
        <div class="divide-outline-variant/30 mt-10 flex flex-col divide-y">
          {posts.map((post) => (
            <PostCard
              title={post.data.title}
              href={`/notes/${post.id}`}
              pubDate={post.data.pubDate}
              description={post.data.description}
              kicker={post.data.tags[0]}
              readingMinutes={readingMinutes(post.body)}
            />
          ))}
        </div>
      )
    }
  </section>
</Layout>
```

- [ ] **Step 2: Create `src/pages/til.astro`**

```astro
---
import { getPublishedEntries } from "@/utils/collection";
import { readingMinutes } from "@/utils/reading-time";
import PostCard from "@/components/PostCard.astro";
import SectionHeading from "@/components/SectionHeading.astro";
import Layout from "@/layouts/Layout.astro";

const posts = await getPublishedEntries("til");
---

<Layout title="TIL | Huan Tran">
  <section class="container-page py-16 sm:py-24">
    <SectionHeading id="til">TIL</SectionHeading>
    <p class="text-on-background-muted mt-4 max-w-2xl font-sans">
      Small things I learned, written down so I don't forget them.
    </p>
    {
      posts.length === 0 ? (
        <p class="text-on-background-muted pt-10 font-sans">
          Nothing here yet.
        </p>
      ) : (
        <div class="divide-outline-variant/30 mt-10 flex flex-col divide-y">
          {posts.map((post) => (
            <PostCard
              title={post.data.title}
              href={`/til/${post.id}`}
              pubDate={post.data.pubDate}
              description={post.data.description}
              kicker={post.data.tags[0]}
              readingMinutes={readingMinutes(post.body)}
            />
          ))}
        </div>
      )
    }
  </section>
</Layout>
```

(Untagged entries render as compact rows — no kicker column, no reading time; the tagged seed TIL entries show their first tag as the kicker.)

- [ ] **Step 3: Add the TIL nav item in `src/components/Header.astro`**

Change only the `links` array (lines 5–10) to:

```ts
const links = [
  { href: "/blog", label: "Blog" },
  { href: "/notes", label: "Notes" },
  { href: "/til", label: "TIL" },
  { href: "/about", label: "About" },
  { href: "/cv", label: "CV" },
] as const;
```

Desktop and mobile menus both render from this array — nothing else changes.

- [ ] **Step 4: Verify**

Run: `pnpm check` — expected: no errors.
Run: `curl -s http://localhost:4321/notes | grep -c "On small tools"` — expected: `1` or more.
Run: `curl -s http://localhost:4321/til | grep -c "word mode"` — expected: `1` or more.
Run: `curl -s http://localhost:4321/ | grep -c 'href="/til"'` — expected: `2` or more (desktop nav + mobile menu).

- [ ] **Step 5: Commit**

```bash
git add src/pages/notes.astro src/pages/til.astro src/components/Header.astro
git commit -m "feat: add notes and til list pages and nav item"
```

---

### Task 6: ArticlePage component + prose styles

**Files:**

- Create: `src/components/ArticlePage.astro`
- Modify: `src/styles/global.css` (append one block at end of file)

**Interfaces:**

- Consumes: `SectionKey` (Task 2), `readingMinutes` (Task 2), `render` from `astro:content`, `.prose-article` CSS (this task).
- Produces: `ArticlePage` with `interface Props { entry: CollectionEntry<SectionKey>; label: string; backHref: string; backLabel: string }` — consumed by all three routes in Task 7.

- [ ] **Step 1: Create `src/components/ArticlePage.astro`**

```astro
---
import { render } from "astro:content";
import type { CollectionEntry } from "astro:content";
import type { SectionKey } from "@/utils/collection";
import { readingMinutes } from "@/utils/reading-time";

interface Props {
  entry: CollectionEntry<SectionKey>;
  label: string;
  backHref: string;
  backLabel: string;
}

const { entry, label, backHref, backLabel } = Astro.props;

// render()'s generated types key on a literal collection name; all three
// sections are Markdown collections, so this cast is type-level only.
const { Content } = await render(entry as CollectionEntry<"blog">);

const minutes = readingMinutes(entry.body);
const dateLabel = entry.data.pubDate.toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
---

<article class="container-page max-w-3xl py-16 sm:py-24">
  <header class="flex flex-col items-start gap-4">
    <p
      class="text-on-background-faint font-mono text-xs font-medium tracking-wide uppercase"
    >
      {
        entry.data.tags.length > 0
          ? `${label} · ${entry.data.tags.join(", ")}`
          : label
      }
    </p>
    <h1
      class="text-primary font-serif text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
    >
      {entry.data.title}
    </h1>
    <p class="text-primary flex gap-4 font-mono text-xs">
      <time datetime={entry.data.pubDate.toISOString()}>{dateLabel}</time>
      {minutes != null && <span>{minutes} min read</span>}
    </p>
  </header>
  <hr class="border-outline-variant mt-10 border-t" />
  <div class="prose-article max-w-2xl pt-10">
    <Content />
  </div>
  <a
    class="text-primary hover:text-on-background-faint mt-16 inline-block font-mono text-xs tracking-wide uppercase transition-colors"
    href={backHref}
  >
    ← {backLabel}
  </a>
</article>
```

- [ ] **Step 2: Append the prose block to `src/styles/global.css`**

Append at the very end of the file (after the `theme-anim` media block). Deliberately **unlayered** so it outranks Tailwind v4's preflight resets, and token-only so all three themes resolve correctly:

```css
/*
 * Rendered Markdown for article pages (blog/notes/til detail), scoped under
 * .prose-article so nothing leaks into chrome. Unlayered on purpose: it must
 * outrank the preflight resets in @layer base. Tokens only — every color
 * resolves per theme.
 */
.prose-article {
  color: var(--color-on-background);
  font-size: 1.0625rem;
  line-height: 1.8;
}

.prose-article h2,
.prose-article h3,
.prose-article h4 {
  color: var(--color-primary);
  font-family: var(--font-serif);
  font-weight: 600;
  line-height: 1.25;
  margin-block: 2.25em 0.75em;
}

.prose-article h2 {
  font-size: 1.75rem;
}

.prose-article h3 {
  font-size: 1.375rem;
}

.prose-article h4 {
  font-size: 1.125rem;
}

.prose-article p,
.prose-article ul,
.prose-article ol,
.prose-article blockquote {
  margin-block-end: 1.25em;
}

.prose-article ul {
  list-style: disc;
  padding-inline-start: 1.5em;
}

.prose-article ol {
  list-style: decimal;
  padding-inline-start: 1.5em;
}

.prose-article li {
  margin-block-end: 0.5em;
}

.prose-article a {
  color: var(--color-primary);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.prose-article a:hover {
  opacity: 0.8;
}

.prose-article blockquote {
  border-inline-start: 1px solid var(--color-outline-variant);
  color: var(--color-on-background-muted);
  font-style: italic;
  padding-inline-start: 1.25em;
}

.prose-article code {
  background: var(--color-surface-muted);
  font-family: var(--font-mono);
  font-size: 0.875em;
  padding: 0.15em 0.4em;
}

.prose-article pre {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-outline-variant);
  overflow-x: auto;
  padding: 1em 1.25em;
}

.prose-article pre code {
  background: none;
  font-size: 0.8125rem;
  line-height: 1.7;
  padding: 0;
}

.prose-article img {
  height: auto;
  max-width: 100%;
}

.prose-article hr {
  border: 0;
  border-block-start: 1px solid var(--color-outline-variant);
  margin-block: 2.5em;
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm check`
Expected: no errors. (ArticlePage has no consumers yet — that's Task 7.)

- [ ] **Step 4: Commit**

```bash
git add src/components/ArticlePage.astro src/styles/global.css
git commit -m "feat: add article template and prose styles"
```

---

### Task 7: Detail routes

**Files:**

- Create: `src/pages/blog/[id].astro`
- Create: `src/pages/notes/[id].astro`
- Create: `src/pages/til/[id].astro`

**Interfaces:**

- Consumes: `getPublishedEntries` (Task 2), `ArticlePage` props (Task 6).
- Produces: static detail routes `/blog/<id>`, `/notes/<id>`, `/til/<id>`.

- [ ] **Step 1: Create `src/pages/blog/[id].astro`**

```astro
---
import type { CollectionEntry } from "astro:content";
import ArticlePage from "@/components/ArticlePage.astro";
import Layout from "@/layouts/Layout.astro";
import { getPublishedEntries } from "@/utils/collection";

export async function getStaticPaths() {
  const entries = await getPublishedEntries("blog");
  return entries.map((entry) => ({
    params: { id: entry.id },
    props: { entry },
  }));
}

interface Props {
  entry: CollectionEntry<"blog">;
}

const { entry } = Astro.props;
---

<Layout title={`${entry.data.title} | Huan Tran`}>
  <ArticlePage
    entry={entry}
    label="Blog"
    backHref="/blog"
    backLabel="All posts"
  />
</Layout>
```

- [ ] **Step 2: Create `src/pages/notes/[id].astro`**

```astro
---
import type { CollectionEntry } from "astro:content";
import ArticlePage from "@/components/ArticlePage.astro";
import Layout from "@/layouts/Layout.astro";
import { getPublishedEntries } from "@/utils/collection";

export async function getStaticPaths() {
  const entries = await getPublishedEntries("notes");
  return entries.map((entry) => ({
    params: { id: entry.id },
    props: { entry },
  }));
}

interface Props {
  entry: CollectionEntry<"notes">;
}

const { entry } = Astro.props;
---

<Layout title={`${entry.data.title} | Huan Tran`}>
  <ArticlePage
    entry={entry}
    label="Notes"
    backHref="/notes"
    backLabel="All notes"
  />
</Layout>
```

- [ ] **Step 3: Create `src/pages/til/[id].astro`**

```astro
---
import type { CollectionEntry } from "astro:content";
import ArticlePage from "@/components/ArticlePage.astro";
import Layout from "@/layouts/Layout.astro";
import { getPublishedEntries } from "@/utils/collection";

export async function getStaticPaths() {
  const entries = await getPublishedEntries("til");
  return entries.map((entry) => ({
    params: { id: entry.id },
    props: { entry },
  }));
}

interface Props {
  entry: CollectionEntry<"til">;
}

const { entry } = Astro.props;
---

<Layout title={`${entry.data.title} | Huan Tran`}>
  <ArticlePage entry={entry} label="TIL" backHref="/til" backLabel="All TIL" />
</Layout>
```

- [ ] **Step 4: Verify**

Run: `pnpm check` — expected: no errors.
Run: `pnpm build` — expected: succeeds. Then:

- `ls dist/blog/` — contains `container-queries/`, does **not** contain `astro-content-collections/` (draft excluded in production).
- `ls dist/notes/` — contains `on-small-tools/` and `slow-mornings/`.
- `ls dist/til/` — contains `astro-zod-import/` and `git-word-diff/`.
- `grep -c "prose-article" dist/blog/container-queries/index.html` — expected: `1` or more.

- [ ] **Step 5: Commit**

```bash
git add "src/pages/blog/[id].astro" "src/pages/notes/[id].astro" "src/pages/til/[id].astro"
git commit -m "feat: add blog, notes, til detail pages"
```

---

### Task 8: Full verification + architecture docs update

**Files:**

- Modify: `CLAUDE.md` (Architecture section only)

**Interfaces:**

- Consumes: everything above.
- Produces: docs matching reality; the spec's full verification checklist run green.

- [ ] **Step 1: Update the Architecture section in `CLAUDE.md`**

Replace the first `src/pages/` bullet:

```markdown
- `src/pages/` — file-based routing (`index`, `blog`, `notes`, `about`, `cv`). `blog`/`notes` are placeholders; no content collections set up yet. `about` is a fully-built editorial page — hero plus hairline-divided sections; its copy lives directly in the page file (unlike the CV, which renders from `src/data/cv.ts`).
```

with:

```markdown
- `src/pages/` — file-based routing (`index`, `blog`, `notes`, `til`, `about`, `cv`). `blog`/`notes`/`til` are list pages rendering content collections from `src/content/<name>/`; each has an `[id].astro` detail route delegating to the shared `ArticlePage` component. `about` is a fully-built editorial page — hero plus hairline-divided sections; its copy lives directly in the page file (unlike the CV, which renders from `src/data/cv.ts`).
```

And directly after the `src/data/cv.ts` bullet, add:

```markdown
- `src/content/` — Markdown entries for the `blog`, `notes`, and `til` collections, defined in `src/content.config.ts` (Zod schemas; `blog` requires `description`). `src/utils/collection.ts` filters drafts (dev-only) and sorts by `pubDate` desc; `src/utils/reading-time.ts` computes display reading time. Add posts by dropping `.md` files here — never hardcode entries in pages.
```

- [ ] **Step 2: Run the spec's full verification checklist**

Run each and confirm:

- `pnpm check` — no errors.
- `pnpm exec eslint .` — no errors.
- `pnpm format:check` — passes (if it fails on touched files, run `pnpm format` and re-check; the pre-commit hook usually keeps this green already).
- `pnpm build` — succeeds.
- Draft behavior: `ls dist/blog/` excludes `astro-content-collections/`; `curl -s http://localhost:4321/blog | grep -c "Modeling content"` (dev server) — expected: `1` or more (draft visible in dev).
- Manual `pnpm dev` click-through: `/`, `/blog`, `/notes`, `/til`, one detail page per type — cards link correctly, detail pages show kicker/serif title/date/reading time/back link, prose renders with the scoped styles (check a theme switch on a detail page).
- Stop the dev server when done: `pnpm astro dev stop`.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update architecture notes for content collections"
```

---

## Self-Review Notes (resolved during planning)

- Spec coverage: content layer+schema (Task 1), reading time (Task 2), draft/sort helper (Task 2), PostCard props (Task 3), homepage latest-3 + omit-when-empty (Task 3), list pages + empty states + intros (Tasks 4–5), nav item (Task 5), ArticlePage (Task 6), prose styles (Task 6), detail routes + titles (Task 7), verification incl. draft + invalid-frontmatter behavior (Tasks 1 and 8), CLAUDE.md staleness (Task 8). Out-of-scope items (RSS, tag pages, pagination, meta description) intentionally absent.
- Type consistency: `SectionKey`, `getPublishedEntries<C>`, `readingMinutes` signatures identical across Tasks 2–7; `PostCard` prop names in Tasks 3–5 match (`title`, `href`, `pubDate`, `description`, `kicker`, `readingMinutes`); `ArticlePage` props (`entry`, `label`, `backHref`, `backLabel`) match between Task 6 and Task 7.
- Known accepted deviations from the letter of the spec: back link is a mono uppercase text link (ArrowLink's built-in arrow points right, wrong direction for a back link); PostCard keeps one structural change (the `<a>` wrapper) to make the card itself the link.

# Content Collections: Blog, Notes, TIL — Design

Date: 2026-09-16
Status: Approved (brainstorming complete)

## Goal

Replace the `blog` and `notes` placeholder pages with a real content layer:
three Astro content collections — `blog`, `notes`, `til` — each with list pages,
detail pages, and shared rendering components. Wire the homepage's demo
PostCards to real content and add TIL to the header nav.

## Decisions (from brainstorming)

| Question               | Decision                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Detail pages per type? | Yes — all three types get `/blog/[id]`, `/notes/[id]`, `/til/[id]`                                              |
| Frontmatter            | Lean: `title`, `pubDate`, optional `description`/`tags`/`draft`; reading time auto-computed, never hand-written |
| Homepage cards         | Latest 3 published blog posts                                                                                   |
| Nav                    | Add TIL: Blog, Notes, TIL, About, CV                                                                            |
| Architecture           | Approach A — three separate collections, three thin route files, shared components                              |

## Content layer

Content lives in `src/content/`, one folder per collection:

```
src/content/
├── blog/    # long-form posts
├── notes/   # short thoughts
└── til/     # today-I-learned snippets
```

New `src/content.config.ts` (Astro 7 content-layer API):

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
  schema: baseSchema.extend({ description: z.string() }), // required for blog
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

- Entry IDs are slugified filenames; the ID **is** the URL (e.g.
  `container-queries.md` → `/blog/container-queries/`). Frontmatter `slug`
  override is not part of this design.
- `blog` requires `description`; `notes` and `til` leave it optional.

### Reading time — `src/utils/reading-time.ts`

Plain function over `entry.body` (raw Markdown): word count ÷ 200 wpm, rounded
up. No dependency. Returns `null` when the result would be under 2 minutes, so
short notes and TIL entries show no reading time at all.

### Shared query helper — `src/utils/collection.ts`

One place that:

- filters drafts (`draft` entries visible in `pnpm dev`, excluded when
  `import.meta.env.PROD`)
- sorts by `pubDate` descending

Every list page, the homepage, and every `getStaticPaths` uses it, so the
filter/sort rule exists exactly once.

### Seed content

Example entries (2 per collection) so lists and detail pages render real
content to verify against. Disposable — replaced by real writing over time.

## Pages & routing

### List pages

- `/blog` — replaces placeholder. `SectionHeading` ("Blog") + hairline
  `divide-y` list of PostCards, newest first. No "Read all posts" link
  (reader is already there).
- `/notes` — replaces placeholder. Same pattern, one-line intro of what notes
  are on this site.
- `/til` — new. Same pattern, one-line intro.

All three pages share structure (heading + intro + divided list) rather than
copy-pasted markup, using the shared query helper.

### Detail pages

```
src/pages/blog/[id].astro    → /blog/<id>/
src/pages/notes/[id].astro   → /notes/<id>/
src/pages/til/[id].astro     → /til/<id>/
```

Each is a thin file (~15 lines): `getStaticPaths()` maps the draft-filtered
collection to `{ params: { id: entry.id } }` and delegates rendering to the
shared `ArticlePage` component. No per-route markup.

### Homepage

The three hardcoded PostCards become the latest 3 published blog posts
(filter → sort → slice(3), same helper). If zero posts exist, the section is
omitted; the "Read all posts" `ArrowLink` stays whenever cards render.

### Nav

`links` in `Header.astro` becomes Blog, Notes, TIL, About, CV — a one-line
change; desktop and mobile menus both render from the array.

### Titles

Detail pages pass `` `${entry.data.title} | Huan Tran` `` to `Layout`; list
pages use `Blog | Huan Tran` etc., matching the existing pattern.

## Components & styling

### `PostCard` refactor (props-driven)

Props: `{ title, href, pubDate, description?, kicker?, readingMinutes? }`

- Kicker (left mono column) = first tag when present; column omitted for
  untagged entries, so TIL one-liners render compact (title + date) instead
  of a heavy card.
- Reading time renders only when `readingMinutes` is non-null.
- Date is `font-mono` in a proper `<time datetime="...">`.
- Whole card links to `href`, keeping the existing hover/underline language.

### `ArticlePage` component (new)

Shared detail template used by all three routes:

- mono kicker line: collection label + optional tags
- serif `h1` title
- mono `<time>` + reading time (when non-null)
- hairline rule
- rendered Markdown content
- back link ("← All notes"-style) to the section list page

Takes the rendered `Content` plus entry data as props.

### Prose styling — hand-rolled, no new dependency

No `@tailwindcss/typography`. A scoped block in `global.css` (~40 lines) under
a single `.prose-article` class on the content wrapper:

- `h2`/`h3` in `font-serif` (matches the editorial-heading convention)
- body `text-on-background`; links `text-primary` with site hover treatment
- code blocks `bg-surface-muted`; `hr` hairline
- styled strictly with existing design tokens; cannot leak into chrome

## Error handling

- Invalid/missing frontmatter → Zod validation fails the build with an error
  naming the file and field. Desired failure mode: loud, at build time.
- Unknown URLs cannot 404 silently — `getStaticPaths` is exhaustive; any path
  not generated simply does not exist in static output.
- Empty collection → list page shows a quiet "Nothing here yet" line instead
  of an empty divided block.

## Verification

No test suite exists; verification is:

1. `pnpm check` — types, including generated collection types
2. `pnpm lint` and `pnpm format:check`
3. `pnpm build`
4. Manual `pnpm dev` pass: `/`, `/blog`, `/notes`, `/til`, one detail page per
   type
5. Behavior checks: a `draft: true` entry visible in dev but absent from the
   built output; a deliberately invalid frontmatter file fails the build with
   a readable error

## Out of scope (future work)

- RSS feed
- Tag pages / filtering UI
- Pagination
- `description` meta tag support in `Layout`

## File inventory

New:

- `src/content.config.ts`
- `src/utils/reading-time.ts`
- `src/utils/collection.ts`
- `src/components/ArticlePage.astro`
- `src/pages/blog/[id].astro`, `src/pages/notes/[id].astro`, `src/pages/til/[id].astro`
- `src/pages/til.astro`
- 6 seed Markdown entries under `src/content/{blog,notes,til}/`

Modified:

- `src/pages/blog.astro`, `src/pages/notes.astro` (placeholders → lists)
- `src/pages/index.astro` (homepage wiring)
- `src/components/PostCard.astro` (props-driven)
- `src/components/Header.astro` (nav link)
- `src/styles/global.css` (`.prose-article` block)

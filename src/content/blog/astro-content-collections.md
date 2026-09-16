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

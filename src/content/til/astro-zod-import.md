---
title: "Zod comes from astro/zod"
pubDate: 2026-09-10
tags: ["astro"]
---

When defining content collection schemas, `z` is imported from `astro/zod`,
not from a separately installed zod package. Astro re-exports it so schemas and
the runtime that validates them can never drift apart.

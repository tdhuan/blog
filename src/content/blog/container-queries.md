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

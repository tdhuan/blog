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

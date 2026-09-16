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

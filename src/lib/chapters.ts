// Pull a "first chapter" excerpt out of a compiled book body for the free
// sample / "Look Inside" flow. Books are stored with chapter headings like
// "Chapter One — The Winding"; we cut at the SECOND heading. When a book has no
// detectable chapter headings, we fall back to a healthy opening slice.
export function firstChapterExcerpt(content: string): { excerpt: string; truncated: boolean } {
  if (!content) return { excerpt: "", truncated: false };

  // Rich HTML books compile each chapter into a <section class="ch">…</section>.
  // The free sample is simply the first section.
  if (/<section[^>]*class=["'][^"']*\bch\b/i.test(content)) {
    const secs = content.match(/<section[\s\S]*?<\/section>/gi) || [];
    if (secs[0]) return { excerpt: secs[0], truncated: secs.length > 1 };
  }

  const lines = content.split(/\r?\n/);
  const headingRe = /^\s*chapter\b/i;
  const headings: number[] = [];
  lines.forEach((l, i) => {
    if (headingRe.test(l)) headings.push(i);
  });

  if (headings.length >= 2) {
    const excerpt = lines.slice(0, headings[1]).join("\n").trim();
    if (excerpt) return { excerpt, truncated: true };
  }

  // No chapters detected — offer a generous opening slice ending on a paragraph.
  const LIMIT = 1600;
  if (content.length > LIMIT + 300) {
    let cut = content.lastIndexOf("\n\n", LIMIT);
    if (cut < 600) cut = content.indexOf("\n\n", LIMIT);
    if (cut < 600) cut = LIMIT;
    return { excerpt: content.slice(0, cut).trim(), truncated: true };
  }

  return { excerpt: content, truncated: false };
}

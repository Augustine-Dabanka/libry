const escHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Plain manuscript text → simple paragraph HTML for the reader/editor.
export function textToHtml(text: string): string {
  return (text || "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => `<p>${escHtml(b).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

// Split an imported manuscript into chapters by detecting heading lines like
// "Chapter One", "CHAPTER 3", "Prologue", "Part II". Falls back to a single
// chapter when nothing is detected, so import always produces something usable.
export function splitIntoChapters(text: string): { title: string; content: string }[] {
  const clean = (text || "").replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  const lines = clean.split("\n");
  const headingRe = /^\s*(chapter\s+[\dIVXLC]+[a-z]*|chapter\s+[a-z]+|prologue|epilogue|part\s+[\dIVXLC]+|part\s+[a-z]+)\b\s*[:.\-—]?\s*(.*)$/i;

  const marks: { line: number; title: string }[] = [];
  lines.forEach((l, i) => {
    const m = l.match(headingRe);
    // A heading line is short and stands alone (not a sentence buried in prose).
    if (m && l.trim().length <= 60) {
      const rest = (m[2] || "").trim();
      const head = m[1].replace(/\s+/g, " ");
      marks.push({ line: i, title: rest ? `${cap(head)} — ${rest}` : cap(head) });
    }
  });

  if (marks.length < 2) {
    return [{ title: "Chapter One", content: clean }];
  }

  const chapters: { title: string; content: string }[] = [];
  // Any text before the first heading becomes an untitled opener.
  if (marks[0].line > 0) {
    const pre = lines.slice(0, marks[0].line).join("\n").trim();
    if (pre) chapters.push({ title: "Opening", content: pre });
  }
  for (let k = 0; k < marks.length; k++) {
    const start = marks[k].line + 1;
    const end = k + 1 < marks.length ? marks[k + 1].line : lines.length;
    const body = lines.slice(start, end).join("\n").trim();
    chapters.push({ title: marks[k].title, content: body });
  }
  return chapters.filter((c) => c.content || c.title);
}

function cap(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

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

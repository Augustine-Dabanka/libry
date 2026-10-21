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
// How much a free sample shows: at least SAMPLE_MIN_WORDS or SAMPLE_SHARE of the
// book, whichever is longer, but never more than SAMPLE_MAX_SHARE. Whole
// chapters are used where the book has them (always at least chapter 1), so a
// sample never stops mid-scene.
export const SAMPLE_MIN_WORDS = 2500;
export const SAMPLE_SHARE = 0.1;
export const SAMPLE_MAX_SHARE = 0.5;

function wordCount(text: string): number {
  const plain = text.replace(/<[^>]+>/g, " ");
  const m = plain.match(/[^\s]+/g);
  return m ? m.length : 0;
}

function sampleTarget(totalWords: number): number {
  const want = Math.max(SAMPLE_MIN_WORDS, Math.ceil(totalWords * SAMPLE_SHARE));
  return Math.min(want, Math.floor(totalWords * SAMPLE_MAX_SHARE));
}

// Take whole parts from the front until the target is reached (at least one).
function takeParts(parts: string[], target: number): number {
  let words = 0;
  let n = 0;
  for (const p of parts) {
    if (n >= 1 && words >= target) break;
    words += wordCount(p);
    n++;
  }
  return n;
}

export function firstChapterExcerpt(content: string): { excerpt: string; truncated: boolean } {
  if (!content) return { excerpt: "", truncated: false };
  const total = wordCount(content);
  const target = sampleTarget(total);

  // Rich HTML books compile each chapter into a <section class="ch">…</section>.
  if (/<section[^>]*class=["'][^"']*\bch\b/i.test(content)) {
    const secs = content.match(/<section[\s\S]*?<\/section>/gi) || [];
    if (secs.length) {
      const n = takeParts(secs, target);
      return { excerpt: secs.slice(0, n).join("\n"), truncated: secs.length > n };
    }
  }

  // Plain text with "Chapter …" headings: split into chapters (text before the
  // first heading belongs to chapter 1).
  const lines = content.split(/\r?\n/);
  const headingRe = /^\s*chapter\b/i;
  const starts: number[] = [];
  lines.forEach((l, i) => {
    if (headingRe.test(l)) starts.push(i);
  });
  if (starts.length >= 2) {
    const bounds = [0, ...starts.slice(1), lines.length];
    const parts: string[] = [];
    for (let i = 0; i < bounds.length - 1; i++) parts.push(lines.slice(bounds[i], bounds[i + 1]).join("\n"));
    const n = takeParts(parts, target);
    const excerpt = parts.slice(0, n).join("\n").trim();
    if (excerpt) return { excerpt, truncated: parts.length > n };
  }

  // No chapters: cut on the paragraph break nearest the target.
  if (total > target + 150) {
    const paras = content.split(/(\n\s*\n)/);
    let words = 0;
    let out = "";
    for (const p of paras) {
      if (words >= target && /\S/.test(p)) break;
      out += p;
      words += wordCount(p);
    }
    const excerpt = out.trim();
    if (excerpt && excerpt.length < content.trim().length) return { excerpt, truncated: true };
  }

  return { excerpt: content, truncated: false };
}

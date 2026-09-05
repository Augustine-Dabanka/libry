// Turns a compiled interactive-story body (chapters with "▸ choice" lines and
// several ALL-CAPS-labelled endings) into a real branching structure the
// interactive reader can drive — so the choices actually do something.

export type IChapter = { title: string; prose: string[]; choices: string[] };
export type IEnding = { label: string; text: string[] };
export type IStory = { chapters: IChapter[]; endings: IEnding[] };

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .trim();
}

export function parseInteractive(content: string): IStory {
  const lines = (content || "").split(/\r?\n/);

  // Group into chapters by "Chapter …" headings.
  const raw: { title: string; body: string[] }[] = [];
  let cur: { title: string; body: string[] } | null = null;
  for (const line of lines) {
    if (/^\s*chapter\b/i.test(line)) {
      cur = { title: line.trim(), body: [] };
      raw.push(cur);
    } else if (cur) {
      cur.body.push(line);
    }
  }

  const chapters: IChapter[] = raw.map((c) => {
    const prose: string[] = [];
    const choices: string[] = [];
    for (const b of c.body) {
      const t = b.trim();
      if (!t) continue;
      if (t.startsWith("▸")) {
        choices.push(t.replace(/^▸\s*/, "").replace(/^Or\s+/i, "").replace(/\.$/, "").trim());
      } else {
        prose.push(t);
      }
    }
    return { title: c.title, prose, choices };
  });

  // The final chapter usually carries no choices — just the labelled endings.
  const endings: IEnding[] = [];
  const last = chapters[chapters.length - 1];
  if (last && last.choices.length === 0) {
    const labelRe = /^([A-Z][A-Z’'\- ]{2,60}[A-Z])\.\s+(.+)$/;
    for (const p of last.prose) {
      const m = p.match(labelRe);
      if (m) endings.push({ label: titleCase(m[1]), text: [m[2].trim()] });
      else if (endings.length) endings[endings.length - 1].text.push(p);
    }
    if (endings.length >= 2) chapters.pop(); // remove endings chapter from the choice flow
  }

  return { chapters: chapters.filter((c) => c.prose.length || c.choices.length), endings };
}

// Map a reader's choice path (0 = first option, 1 = second) to one ending.
// More "second" choices → later ending, so the path genuinely steers the finish.
export function resolveEnding(path: number[], endingCount: number): number {
  if (endingCount <= 0) return -1;
  if (endingCount === 1) return 0;
  const sum = path.reduce((a, b) => a + b, 0);
  const ratio = path.length ? sum / path.length : 0;
  if (endingCount === 3) return ratio < 0.34 ? 0 : ratio < 0.67 ? 1 : 2;
  return Math.min(endingCount - 1, Math.round(ratio * (endingCount - 1)));
}

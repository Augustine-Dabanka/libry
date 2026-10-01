// Comic content format for Libry.
//
// A comic's `content` is plain text (like interactive stories), one directive
// per line, so it degrades gracefully and is easy to author or seed:
//
//   # Chapter One            → a divider band with a label
//   https://…/page-01.png    → a full-width page/panel image
//   /storage/…/p2.jpg | The storm breaks   → image with a caption
//
// If the content is instead HTML (e.g. compiled from the canvas PageDesigner),
// we simply pull the <img> sources in document order. Either way the reader
// renders a vertical webtoon-style strip (or page-by-page).

export type ComicPage =
  | { kind: "image"; src: string; caption?: string }
  | { kind: "divider"; label: string };

export type Comic = { pages: ComicPage[] };

export function isComicType(type: string | null | undefined): boolean {
  const t = (type || "").toLowerCase();
  return t === "comic" || t === "comics" || t === "graphic novel" || t === "webtoon";
}

const IMG_EXT = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i;

function looksLikeImage(s: string): boolean {
  const v = s.trim();
  return (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("/") ||
    v.startsWith("data:image/") ||
    IMG_EXT.test(v)
  );
}

export function parseComic(content: string): Comic {
  const pages: ComicPage[] = [];
  if (!content) return { pages };

  // HTML path: extract <img src="…"> in order.
  if (/<img\b/i.test(content)) {
    const re = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      const src = m[1]?.trim();
      if (src) {
        const altMatch = /\balt\s*=\s*["']([^"']*)["']/i.exec(m[0]);
        const caption = altMatch?.[1]?.trim();
        pages.push(caption ? { kind: "image", src, caption } : { kind: "image", src });
      }
    }
    return { pages };
  }

  // Plain-text directive path.
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("//")) continue;
    if (line.startsWith("#")) {
      const label = line.replace(/^#+\s*/, "").trim();
      if (label) pages.push({ kind: "divider", label });
      continue;
    }
    const [srcPart, ...capParts] = line.split("|");
    const src = (srcPart ?? "").trim();
    if (!looksLikeImage(src)) continue;
    const caption = capParts.join("|").trim();
    pages.push(caption ? { kind: "image", src, caption } : { kind: "image", src });
  }
  return { pages };
}

export function comicPageCount(c: Comic): number {
  return c.pages.filter((p) => p.kind === "image").length;
}


// Comic reading layouts. "manga" = right to left, page by page.
export type ComicMode = "scroll" | "pages" | "manga";

// Default layout by format: manga reads right to left page by page; manhwa,
// webtoons and other comics scroll top to bottom. Readers can always switch.
// (Lives here, not in the client component, so server pages can call it.)
export function defaultComicMode(category?: string | null): ComicMode {
  const c = (category || "").toLowerCase();
  if (c.includes("manga")) return "manga";
  return "scroll";
}

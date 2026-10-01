// Allowlist HTML sanitizer for creator-authored book content.
//
// Book bodies can now be rich HTML (headings, images, comic panels, shapes),
// authored in the rich editor and rendered to *other people* in the reader —
// so it must be sanitized before it ever hits dangerouslySetInnerHTML. This is
// a conservative allowlist: unknown tags are dropped (their text kept), unknown
// or dangerous attributes are stripped, and script-bearing URLs are removed.
// Pure string transforms only, so it runs identically on the server and client.

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "mark", "sub", "sup", "small",
  "h1", "h2", "h3", "h4", "blockquote", "ul", "ol", "li", "a",
  "img", "figure", "figcaption", "hr", "div", "span", "section",
  "svg", "path", "circle", "rect", "line", "polygon", "polyline", "ellipse", "g",
]);

const ALLOWED_ATTR = new Set([
  "href", "src", "alt", "title", "class", "style", "width", "height",
  "target", "rel", "data-title", "data-align", "data-size", "data-block",
  // svg
  "viewbox", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
  "d", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "x2", "y1", "y2",
  "points", "transform", "opacity", "preserveaspectratio",
]);

const VOID_TAGS = new Set(["br", "hr", "img"]);

// Browsers decode HTML entities inside attributes, so "jav&#x61;script:" and
// "javascript&colon;" still run. Decode first, strip whitespace/control chars,
// then allow only known-safe schemes (or relative links).
function decodeEntities(v: string): string {
  return v
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16) || 0))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d) || 0))
    .replace(/&colon;/gi, ":").replace(/&tab;/gi, "").replace(/&newline;/gi, "")
    .replace(/&lpar;/gi, "(").replace(/&rpar;/gi, ")").replace(/&amp;/gi, "&");
}
function safeUrl(raw: string, key: "href" | "src" | string): boolean {
  // eslint-disable-next-line no-control-regex
  const v = decodeEntities(raw).replace(/[\u0000-\u0020\u007f-\u009f]/g, "").toLowerCase();
  if (v === "") return false;
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(v);
  if (!scheme) return true; // relative: "/x", "#x", "x.png"
  if (["http", "https"].includes(scheme[1])) return true;
  if (key === "href" && scheme[1] === "mailto") return true;
  if (key === "src" && /^data:image\/(png|jpe?g|gif|webp|avif);/.test(v)) return true;
  return false;
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  let s = html;

  // Drop comments and whole dangerous elements (with or without a close tag).
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<(script|style|iframe|object|embed|noscript|template|link|meta|form|input|button)\b[\s\S]*?<\/\1\s*>/gi, "");
  s = s.replace(/<(script|style|iframe|object|embed|noscript|template|link|meta|form|input|button)\b[^>]*\/?>/gi, "");

  // Rewrite every remaining tag through the allowlist.
  s = s.replace(/<\/?([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (m, rawName: string, rawAttrs: string) => {
    const tag = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (m.startsWith("</")) return `</${tag}>`;

    let out = "";
    const attrRe = /([a-zA-Z_:][-\w:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
    let a: RegExpExecArray | null;
    while ((a = attrRe.exec(rawAttrs))) {
      const key = a[1].toLowerCase();
      let val = a[3] ?? a[4] ?? a[5] ?? "";
      if (key.startsWith("on")) continue;
      if (!ALLOWED_ATTR.has(key)) continue;
      if ((key === "href" || key === "src") && !safeUrl(val, key)) continue;
      if (key === "style" && /expression|javascript:|url\s*\(/i.test(val)) continue;
      val = val.replace(/"/g, "&quot;");
      out += ` ${key}="${val}"`;
    }
    return `<${tag}${out}${VOID_TAGS.has(tag) ? " /" : ""}>`;
  });

  // Defense in depth: nuke any stray inline handler that slipped through.
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  return s;
}

// Cheap check: does this body contain real HTML markup (vs. legacy plain text)?
export function looksLikeHtml(content: string): boolean {
  return /<(section|div|p|h[1-6]|img|figure|blockquote|ul|ol|svg|br|strong|em|hr)\b/i.test(content);
}

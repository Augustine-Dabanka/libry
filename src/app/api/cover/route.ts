// On-the-fly SVG book/product covers for anything without a real image.
// Deterministic: the same title always yields the same colours, so covers are
// stable across renders and cache forever. Driven purely by query params
// (?t=title&a=subtitle) — no database read, works for books and products alike.

export const runtime = "edge";

function esc(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&#39;", '"': "&quot;" }[c] as string));
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function wrap(title: string, maxChars = 15, maxLines = 4): string[] {
  const words = title.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else { lines.push(cur); cur = w; }
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.{1}$/, "…");
  }
  return lines.length ? lines : ["Untitled"];
}

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("t") || "Untitled").slice(0, 90);
  const subtitle = (searchParams.get("a") || "").slice(0, 60);

  const h = hash(title);
  const hue = h % 360;
  const hue2 = (hue + 28) % 360;
  const c1 = `hsl(${hue} 42% 24%)`;
  const c2 = `hsl(${hue2} 48% 12%)`;
  const gold = "#C5A059";
  const ivory = "#F2E9D8";

  const lines = wrap(title);
  const lineH = 34;
  const blockH = lines.length * lineH;
  const startY = 225 - blockH / 2 + 24;

  const titleTspans = lines
    .map((ln, i) => `<tspan x="150" y="${startY + i * lineH}">${esc(ln)}</tspan>`)
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="450" fill="url(#g)"/>
  <rect x="10" y="10" width="280" height="430" fill="none" stroke="${gold}" stroke-opacity="0.35" stroke-width="1"/>
  <text x="150" y="52" text-anchor="middle" fill="${gold}" font-family="Georgia, serif" font-size="13" letter-spacing="5" opacity="0.9">LIBRY</text>
  <line x1="120" y1="72" x2="180" y2="72" stroke="${gold}" stroke-width="1" opacity="0.6"/>
  <text text-anchor="middle" fill="${ivory}" font-family="Georgia, 'Times New Roman', serif" font-size="27" font-weight="600">${titleTspans}</text>
  ${subtitle ? `<text x="150" y="400" text-anchor="middle" fill="${ivory}" fill-opacity="0.72" font-family="Georgia, serif" font-size="14" font-style="italic">${esc(subtitle)}</text>` : ""}
  <line x1="120" y1="418" x2="180" y2="418" stroke="${gold}" stroke-width="1" opacity="0.4"/>
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

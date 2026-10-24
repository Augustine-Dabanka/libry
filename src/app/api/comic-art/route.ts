import { NextRequest } from "next/server";
import { getOriginalComic } from "@/lib/originalComics";

export const dynamic = "force-dynamic";

const PALETTES: Record<string, [string, string, string]> = {
  "Sci-Fi Adventure": ["#122B3D", "#F5B642", "#E8F1F2"],
  Fantasy: ["#243B32", "#D5B46A", "#F3EBDD"],
  "Sports & Supernatural": ["#183A52", "#F2A65A", "#F6F0E6"],
  "Comedy & Science": ["#2D3558", "#F4B942", "#F8F2E7"],
  "Fantasy Mystery": ["#282445", "#C9A8E8", "#F4EFFF"],
  Adventure: ["#164A4A", "#E7A85B", "#F5EBDD"],
  "School Life": ["#3B4B63", "#E6A15B", "#F4F0E8"],
  Mystery: ["#343047", "#C3A16C", "#F4EFE5"],
  "Science Fiction": ["#172C3A", "#A7D8D8", "#E8F4F2"],
  "Sports & Friendship": ["#234D42", "#F0A44A", "#F6F0E4"],
  "Historical Fantasy": ["#4C3428", "#D5A75E", "#F3E5C7"],
  "Romance & Mystery": ["#3E2C45", "#D8A0A8", "#F7EAF0"],
  "Supernatural Mystery": ["#292536", "#B6A1C9", "#F2EAF4"],
  "Fantasy Comedy": ["#35513B", "#E5B85B", "#F6F1E4"],
  "Superhero Adventure": ["#203F55", "#E7B24E", "#F0F4F3"],
  "Dark Fantasy": ["#292A39", "#C5A3A8", "#EEE9E8"],
  "College Mystery": ["#343A48", "#C9A77D", "#F4EFE7"],
  "Slice of Life": ["#45616B", "#E6B88C", "#F8F2E8"],
  "Gothic Thriller": ["#322C36", "#C89B88", "#F0E5DF"],
  Comedy: ["#4A3A2B", "#F0B64F", "#FFF5DE"],
  "Crime Mystery": ["#293844", "#D6A46D", "#F3EEE5"],
  Whodunit: ["#394B59", "#DAB878", "#F7F0DF"],
  "Epic Fantasy": ["#24313F", "#E07848", "#F5E6D4"],
  "Magical Realism": ["#315344", "#E5BE6A", "#F3F0D9"],
  "Time-Travel Sci-Fi": ["#24345A", "#8EC5D2", "#E8F0F6"],
};

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return h >>> 0;
}
function lines(text: string, max = 36) {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > max && line) { out.push(line); line = word; }
    else line = (line + " " + word).trim();
  }
  if (line) out.push(line);
  return out.slice(0, 3);
}
function textLines(text: string, x: number, y: number, max = 36, size = 19) {
  return lines(text, max).map((line, i) => `<text x="${x}" y="${y + i * (size + 5)}" font-family="Georgia,serif" font-size="${size}" fill="#18202a">${esc(line)}</text>`).join("");
}
function cover(title: string, hero: string, category: string, bg: string, accent: string, paper: string, seed: number) {
  const x = 300 + (seed % 80) - 40;
  const y = 405 + (seed % 45) - 22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <defs><linearGradient id="g" x2="0.9" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="#111821"/></linearGradient><pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${paper}" opacity=".22"/></pattern></defs>
  <rect width="600" height="900" fill="url(#g)"/><rect width="600" height="900" fill="url(#dots)"/>
  <circle cx="${x}" cy="390" r="205" fill="${accent}" opacity=".18"/><circle cx="${x + 20}" cy="380" r="140" fill="${accent}" opacity=".22"/>
  <path d="M0 620 Q160 560 300 640 T600 600 V900 H0Z" fill="#0D151C" opacity=".8"/>
  <path d="M70 660 L130 520 L190 660Z M390 650 L460 470 L540 650Z" fill="${accent}" opacity=".45"/>
  <g transform="translate(${x - 95} 440)"><path d="M95 35 C45 35 25 80 32 130 L42 240 L148 240 L158 130 C165 80 145 35 95 35Z" fill="${paper}"/><circle cx="95" cy="8" r="47" fill="${accent}"/><path d="M50 -8 Q95 -65 140 -8 L132 7 Q95 -20 58 7Z" fill="#17212A"/><path d="M50 100 L0 180 M140 100 L190 170" stroke="${paper}" stroke-width="22" stroke-linecap="round"/><path d="M65 240 L55 320 M125 240 L135 320" stroke="${paper}" stroke-width="28" stroke-linecap="round"/></g>
  <rect x="34" y="34" width="532" height="832" rx="8" fill="none" stroke="${paper}" stroke-opacity=".55" stroke-width="2"/>
  <text x="58" y="92" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="6" fill="${accent}">LYBRY ORIGINAL COMICS</text>
  <text x="58" y="160" font-family="Georgia,serif" font-size="48" font-weight="700" fill="${paper}">${esc(title)}</text>
  <text x="60" y="205" font-family="Arial,sans-serif" font-size="17" letter-spacing="3" fill="${paper}" opacity=".8">${esc(category.toUpperCase())}</text>
  <rect x="58" y="744" width="484" height="82" rx="8" fill="${paper}" opacity=".94"/>
  <text x="82" y="779" font-family="Georgia,serif" font-size="19" fill="${bg}">An original visual story</text>
  <text x="82" y="807" font-family="Arial,sans-serif" font-size="14" letter-spacing="2" fill="${bg}" opacity=".7">WRITTEN FOR LYBRY</text>
  </svg>`;
}
function comicPage(title: string, hero: string, scenes: string[], bg: string, accent: string, paper: string, seed: number, page: number) {
  const panels = scenes.map((scene, i) => {
    const y = 24 + i * 270;
    const flip = (seed + page + i) % 2 === 0;
    const personX = flip ? 245 : 105;
    const horizon = y + 165 + ((seed + i) % 26);
    return `<g>
      <rect x="22" y="${y}" width="856" height="246" rx="7" fill="${paper}" stroke="#121820" stroke-width="6"/>
      <path d="M25 ${horizon} Q180 ${horizon - 38} 350 ${horizon} T875 ${horizon - 8} V267 H25Z" fill="${bg}" opacity=".18"/>
      <circle cx="${flip ? 760 : 115}" cy="${y + 54}" r="28" fill="${accent}" opacity=".75"/>
      <path d="M25 ${y + 194} L140 ${y + 145} L210 ${y + 194} L310 ${y + 138} L430 ${y + 195} L570 ${y + 144} L700 ${y + 192} L875 ${y + 145} V267 H25Z" fill="${bg}" opacity=".45"/>
      <g transform="translate(${personX} ${y + 78})">
        <path d="M42 48 Q5 52 8 102 L14 130 L76 130 L82 102 Q80 52 42 48Z" fill="${bg}"/>
        <circle cx="44" cy="25" r="28" fill="${accent}"/>
        <path d="M17 18 Q40 -12 67 18 L64 30 Q42 10 20 31Z" fill="#111820"/>
        <path d="M17 70 L-10 108 M69 70 L96 105" stroke="${bg}" stroke-width="13" stroke-linecap="round"/>
        <path d="M28 130 L24 165 M58 130 L63 165" stroke="${bg}" stroke-width="15" stroke-linecap="round"/>
      </g>
      <path d="M${flip ? 390 : 310} ${y + 36} q0 -24 27 -24 h${flip ? 365 : 290} q25 0 25 24 v30 q0 24 -25 24 h-95 l-28 24 5 -24 h-182 q-27 0 -27 -24Z" fill="#FFFDF6" stroke="#121820" stroke-width="3"/>
      ${textLines(scene, flip ? 425 : 345, y + 46, 34, 17)}
      <rect x="38" y="${y + 209}" width="285" height="28" rx="4" fill="#121820" opacity=".92"/>
      <text x="50" y="${y + 228}" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="#FFFDF6">${esc(title.toUpperCase())} · ${String(page).padStart(2,"0")}.${i + 1}</text>
    </g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="840" viewBox="0 0 900 840">
    <rect width="900" height="840" fill="${bg}"/>
    <text x="28" y="17" font-family="Arial,sans-serif" font-size="11" font-weight="700" letter-spacing="4" fill="${paper}" opacity=".85">${esc(hero.toUpperCase())} · ${esc(title.toUpperCase())}</text>
    ${panels}
    <text x="870" y="830" text-anchor="end" font-family="Arial,sans-serif" font-size="11" letter-spacing="2" fill="${paper}" opacity=".7">LYBRY ORIGINALS · ${page}</text>
  </svg>`;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") || "";
  const page = Number(url.searchParams.get("page") || "0");
  const comic = getOriginalComic(slug);
  if (!comic || !Number.isInteger(page) || page < 0 || page > 3) {
    return new Response("Not found", { status: 404 });
  }
  const [bg, accent, paper] = PALETTES[comic.category] ?? ["#263746", "#E6B86A", "#F5EFE4"];
  const seed = hash(comic.slug);
  const svg = page === 0
    ? cover(comic.title, comic.hero, comic.category, bg, accent, paper, seed)
    : comicPage(comic.title, comic.hero, comic.pages[page - 1]!, bg, accent, paper, seed, page);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

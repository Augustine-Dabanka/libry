import JSZip from "jszip";

// Minimal, valid EPUB 3 generator for Libry's "download your copy" perk. Text-
// focused (novels/classics) with a soft, personalised watermark — no hard DRM,
// which fits the calm brand.

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type EpubChapter = { title: string; paras: string[] };

export type EpubInput = {
  bookId: string;
  title: string;
  author: string;
  chapters: EpubChapter[];
  watermark: string;
};

// Split raw book text into chapters at "Chapter N" headings (same rule as the
// reader). HTML content is reduced to text first so the EPUB is always valid XML.
export function contentToChapters(content: string, isHtml: boolean): EpubChapter[] {
  const text = isHtml
    ? content
        .replace(/<\/(p|div|h[1-6]|li|br)\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
    : content;
  const paras = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const chapters: EpubChapter[] = [];
  let cur: EpubChapter | null = null;
  for (const p of paras) {
    // Skip bare image lines — they don't travel well in a text EPUB.
    if (/^!\[.*?\]\((https?:\/\/[^\s)]+)\)$/.test(p) || /^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(p)) continue;
    if (/^chapter\b/i.test(p) && p.length <= 60) {
      cur = { title: p, paras: [] };
      chapters.push(cur);
    } else {
      if (!cur) { cur = { title: "", paras: [] }; chapters.push(cur); }
      cur.paras.push(p);
    }
  }
  return chapters.length ? chapters : [{ title: "", paras }];
}

function xhtml(title: string, body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"/><title>${esc(title)}</title><link rel="stylesheet" href="style.css"/></head><body>${body}</body></html>`;
}

export async function buildEpub(input: EpubInput): Promise<Uint8Array> {
  const { title, author, chapters, watermark, bookId } = input;
  const zip = new JSZip();
  const uid = `urn:libry:book:${bookId}`;

  // mimetype MUST be first and stored (uncompressed).
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`
  );

  zip.file(
    "OEBPS/style.css",
    `body{font-family:Georgia,serif;line-height:1.65;margin:1.2em}
h1{font-size:1.9em}h1,h2{text-align:center;font-family:Georgia,serif}
h2{margin:2.4em 0 1.2em}
p{margin:0 0 0.9em;text-indent:1.3em}
p.first{text-indent:0}
.title{margin-top:22%}
.wm{color:#8a8178;font-size:0.8em;text-align:center;margin-top:3em;border-top:1px solid #d8d2c8;padding-top:1em}`
  );

  zip.file(
    "OEBPS/title.xhtml",
    xhtml(
      title,
      `<div class="title"><h1>${esc(title)}</h1><p style="text-align:center">by ${esc(author || "Unknown author")}</p><p class="wm">${esc(watermark)}</p></div>`
    )
  );

  const items: { id: string; href: string; title: string }[] = [];
  chapters.forEach((ch, i) => {
    const id = `ch${i + 1}`;
    const href = `${id}.xhtml`;
    const heading = ch.title ? `<h2>${esc(ch.title)}</h2>` : "";
    const paras = ch.paras.map((p, j) => `<p${j === 0 ? ' class="first"' : ""}>${esc(p)}</p>`).join("");
    const wm = i === chapters.length - 1 ? `<p class="wm">${esc(watermark)}</p>` : "";
    zip.file(`OEBPS/${href}`, xhtml(ch.title || `Chapter ${i + 1}`, `${heading}${paras}${wm}`));
    items.push({ id, href, title: ch.title || `Chapter ${i + 1}` });
  });

  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><meta charset="utf-8"/><title>Contents</title></head><body><nav epub:type="toc"><h1>Contents</h1><ol>${items
      .map((it) => `<li><a href="${it.href}">${esc(it.title)}</a></li>`)
      .join("")}</ol></nav></body></html>`
  );

  const manifest = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="css" href="style.css" media-type="text/css"/>`,
    `<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>`,
    ...items.map((it) => `<item id="${it.id}" href="${it.href}" media-type="application/xhtml+xml"/>`),
  ].join("");
  const spine = [`<itemref idref="title"/>`, ...items.map((it) => `<itemref idref="${it.id}"/>`)].join("");

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${uid}</dc:identifier>
    <dc:title>${esc(title)}</dc:title>
    <dc:creator>${esc(author || "Unknown author")}</dc:creator>
    <dc:language>en</dc:language>
    <dc:publisher>Libry</dc:publisher>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
  </metadata>
  <manifest>${manifest}</manifest>
  <spine>${spine}</spine>
</package>`
  );

  return zip.generateAsync({ type: "uint8array" });
}

export function bookFilename(title: string): string {
  const slug = (title || "libry-book").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "book";
  return `${slug}-libry.epub`;
}

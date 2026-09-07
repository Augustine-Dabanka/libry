// Shared styling for rich book content — used by BOTH the editor surface and
// the reader, so what a creator lays out is exactly what a reader sees. Class
// names are prefixed `le-` (Libry editor) and survive the sanitizer's allowlist.
export const RICH_CSS = `
.le-body{font-family:var(--serif,Georgia,serif);line-height:1.9;}
.le-body section.ch{margin:0 0 2.6em;}
.le-body section.ch::after{content:"";display:table;clear:both;}
.le-body .chapter-title{font-size:1.7em;text-align:left;margin:.2em 0 1em;line-height:1.2;}
.le-body h2,.le-body h3{font-family:var(--serif,Georgia,serif);line-height:1.25;margin:1.6em 0 .5em;}
.le-body h2{font-size:1.5em;}
.le-body h3{font-size:1.2em;}
.le-body p{margin:0 0 1.1em;}
.le-body blockquote{margin:1.4em 0;padding:.4em 0 .4em 1.1em;border-left:3px solid currentColor;opacity:.85;font-style:italic;}
.le-body ul,.le-body ol{margin:0 0 1.1em 1.4em;padding:0;}
.le-body li{margin:.3em 0;}
.le-body a{color:#C5A059;}
.le-hr{border:none;border-top:1px solid currentColor;opacity:.25;margin:2em auto;width:40%;}
/* images */
.le-fig{margin:1.5em 0;}
.le-fig img{display:block;max-width:100%;border-radius:12px;}
.le-fig figcaption{font-family:var(--sans,system-ui,sans-serif);font-size:.82em;opacity:.65;text-align:center;margin-top:.5em;}
.le-fig.le-al-c{margin-left:auto;margin-right:auto;}
.le-fig.le-al-c img{margin:0 auto;}
.le-fig.le-al-l{float:left;margin:.4em 1.4em .8em 0;}
.le-fig.le-al-r{float:right;margin:.4em 0 .8em 1.4em;}
.le-fig.le-sz-s{width:42%;}
.le-fig.le-sz-m{width:66%;}
.le-fig.le-sz-l{width:100%;}
.le-fig.le-al-c.le-sz-s,.le-fig.le-al-c.le-sz-m{max-width:100%;}
/* callout */
.le-callout{margin:1.5em 0;padding:1.1em 1.3em;border-radius:14px;border:1px solid currentColor;background:rgba(197,160,89,0.08);}
.le-callout p:last-child{margin-bottom:0;}
/* comic grid */
.le-comic{display:grid;gap:.6rem;margin:1.6em 0;}
.le-comic.le-cols-2{grid-template-columns:1fr 1fr;}
.le-comic.le-cols-3{grid-template-columns:1fr 1fr 1fr;}
.le-comic.le-cols-4{grid-template-columns:1fr 1fr;}
.le-panel{position:relative;aspect-ratio:3/4;border-radius:10px;overflow:hidden;background:rgba(127,127,127,0.14);border:2px solid rgba(127,127,127,0.35);display:flex;align-items:center;justify-content:center;}
.le-panel img{width:100%;height:100%;object-fit:cover;display:block;}
.le-panel .le-ph{font-family:var(--sans,system-ui,sans-serif);font-size:.78rem;opacity:.6;text-align:center;padding:.5rem;}
@media(max-width:560px){.le-comic.le-cols-3{grid-template-columns:1fr 1fr;}.le-fig.le-al-l,.le-fig.le-al-r{float:none;width:100%;margin:1.5em 0;}}
/* shapes */
.le-shape{display:flex;justify-content:center;margin:1.4em 0;}
.le-shape svg{max-width:100%;}
`;

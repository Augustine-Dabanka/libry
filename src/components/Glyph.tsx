import Icon, { type IconName } from "@/components/Icon";

// Emoji -> Lybry icon. Old data (community icons saved in the database, picker
// options, notification kinds) still stores emoji; render it through <Glyph>
// and it shows as a crisp icon in the current icon style instead of whatever
// emoji font the phone has. Unknown UI glyphs fall back to a preset icon; story text
// is rendered by story components, not this icon-only component.
export const EMOJI_ICON: Record<string, IconName> = {
  "🌙": "moon", "☀": "sun", "🖥": "monitor", "📖": "book-open", "📕": "book", "📗": "book", "📘": "book",
  "📚": "library-big", "☁": "cloud", "✍": "pen-line", "✒": "feather", "⚡": "zap", "🛒": "shopping-cart",
  "🔒": "lock", "🔓": "lock-open", "👥": "users", "📌": "pin", "👍": "thumbs-up", "👎": "thumbs-down",
  "🖼": "image", "💬": "message-circle", "🏆": "trophy", "📱": "smartphone", "👤": "user", "🤝": "handshake",
  "🎉": "party-popper", "🏅": "medal", "🎧": "headphones", "💰": "coins", "🎨": "palette", "🎁": "gift",
  "❤": "heart", "🤍": "heart", "💛": "heart", "🖤": "heart", "♥": "heart", "🗑": "trash", "🔗": "link",
  "🧩": "puzzle", "🎬": "clapperboard", "🎓": "graduation-cap", "📦": "package", "📄": "file-text",
  "🦊": "squirrel", "🦉": "bird", "🐱": "cat", "🐢": "turtle", "🦋": "feather", "🧚": "wand-sparkles",
  "🐉": "castle", "⭐": "star", "✨": "sparkles", "☕": "coffee", "🕯": "flame", "🔥": "flame", "🔔": "bell",
  "🧸": "baby", "🎒": "backpack", "🐺": "moon-star", "🧛": "droplet", "👻": "ghost", "⚔": "swords",
  "🏳️‍🌈": "rainbow", "🏳": "flag", "📋": "clipboard-list", "⛔": "ban", "⏸": "circle-pause", "📊": "chart-column",
  "🌍": "globe", "📣": "megaphone", "🛡": "shield", "🗓": "calendar", "✉": "mail", "🚀": "rocket",
  "💌": "mail-open", "🔪": "fingerprint-pattern", "✅": "circle-check", "⬜": "square", "💼": "briefcase",
  "🔍": "search", "🌿": "git-branch", "💥": "comics", "🔞": "shield-alert", "♪": "music", "✦": "sparkle",
};

const norm = (e: string) => e.replace(/️/g, "").trim();

export function iconFor(value: string | null | undefined): IconName | null {
  if (!value) return null;
  return EMOJI_ICON[value.trim()] ?? EMOJI_ICON[norm(value)] ?? null;
}

export default function Glyph({
  e,
  size = "1.1em",
  fallback = "sparkles",
  label,
  style,
}: {
  e: string | null | undefined;
  size?: number | string;
  fallback?: IconName | null;
  label?: string;
  style?: React.CSSProperties;
}) {
  const name = iconFor(e) ?? fallback;
  if (name) return <Icon name={name} size={size} label={label} style={style} />;
  return null;
}

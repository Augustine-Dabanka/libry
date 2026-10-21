// A greeting that changes with the day: birthdays and holidays first, then a
// mix of time-of-day, generation-flavoured and "hello around the world" lines.
// Uses the reader's local clock (so it's right in their timezone) and, if we
// have it, their stored date of birth. The pick is stable for the whole day,
// so it doesn't change on every page load or flicker between renders.
//
// Generations are guessed from birth year only (Pew ranges), never from photos.

export type Generation = "alpha" | "genz" | "millennial" | "genx" | "boomer" | null;

export function generationOf(dob?: string | null): Generation {
  const y = dob ? Number(dob.slice(0, 4)) : NaN;
  if (!Number.isFinite(y) || y < 1900) return null;
  if (y >= 2010) return "alpha";
  if (y >= 1997) return "genz";
  if (y >= 1981) return "millennial";
  if (y >= 1965) return "genx";
  return "boomer";
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const md = (d: Date) => (d.getMonth() + 1) * 100 + d.getDate();
// US Thanksgiving: 4th Thursday of November.
function thanksgiving(y: number) {
  const d = new Date(y, 10, 1);
  const first = (4 - d.getDay() + 7) % 7 + 1;
  return 1100 + first + 21;
}

export type Greeting = { line: string; kind: "birthday" | "holiday" | "time" | "generation" | "world"; emoji?: string };

export function greet(name: string, opts: { dob?: string | null; now?: Date } = {}): Greeting {
  const now = opts.now ?? new Date();
  const n = name.trim().split(/\s+/)[0] || "reader";
  const today = md(now);
  const seed = hash(`${n}|${now.getFullYear()}-${today}`);

  if (opts.dob && /^\d{4}-\d{2}-\d{2}$/.test(opts.dob)) {
    const bm = Number(opts.dob.slice(5, 7)) * 100 + Number(opts.dob.slice(8, 10));
    if (bm === today) return { line: `Happy birthday, ${n}!`, kind: "birthday", emoji: "🎂" };
  }

  const tg = thanksgiving(now.getFullYear());
  const holidays: [number, number, string, string][] = [
    [101, 102, `Happy New Year, ${n}!`, "🎆"],
    [214, 214, `Happy Valentine's Day, ${n}`, "💌"],
    [317, 317, `Happy St. Patrick's Day, ${n}`, "🍀"],
    [619, 619, `Happy Juneteenth, ${n}`, "✊🏾"],
    [704, 704, `Happy Fourth of July, ${n}!`, "🎇"],
    [1025, 1031, `Spooky season, ${n}. Boo!`, "🎃"],
    [tg - 1, tg + 1, `Happy Thanksgiving, ${n}`, "🦃"],
    [1220, 1226, `Merry Christmas, ${n}!`, "🎄"],
    [1231, 1231, `Last read of the year, ${n}?`, "🥂"],
  ];
  for (const [a, b, line, emoji] of holidays) if (today >= a && today <= b) return { line, kind: "holiday", emoji };

  const h = now.getHours();
  const time = h < 5 ? `Up late, ${n}? Same.` : h < 12 ? `Good morning, ${n}` : h < 17 ? `Good afternoon, ${n}` : h < 22 ? `Good evening, ${n}` : `Night owl mode, ${n}`;
  const timeEmoji = h < 5 || h >= 22 ? "🌙" : h < 12 ? "☀️" : h < 17 ? "📚" : "🌆";

  const gen = generationOf(opts.dob);
  const byGen: Record<Exclude<Generation, null>, string[]> = {
    alpha: [`Yo ${n}, let's gooo!`, `${n} has entered the chat`, `Ready to read, ${n}?`, `Hey ${n}! Story time`],
    genz: [`What's poppin', ${n}`, `Main character energy, ${n}`, `Heyyy ${n}`, `${n}, it's giving reading era`],
    millennial: [`Hey ${n}, good to see you`, `Treat yourself to a chapter, ${n}`, `Welcome back, ${n} ✨`, `${n}! Your shelf missed you`],
    genx: [`Hey there, ${n}`, `Good to have you back, ${n}`, `Pull up a chair, ${n}`],
    boomer: [`Welcome back, ${n}`, `Hello again, ${n}`, `Lovely to see you, ${n}`],
  };
  const world = [`Hola, ${n}`, `Bonjour, ${n}`, `Akwaaba, ${n}`, `Jambo, ${n}`, `Ciao, ${n}`, `Konnichiwa, ${n}`, `Olá, ${n}`, `Ẹ kú àbọ̀, ${n}`];

  const r = seed % 100;
  if (gen && r < 40) { const l = byGen[gen]; return { line: l[seed % l.length]!, kind: "generation", emoji: "👋" }; }
  if (r >= 75) return { line: world[seed % world.length]!, kind: "world", emoji: "🌍" };
  return { line: time, kind: "time", emoji: timeEmoji };
}

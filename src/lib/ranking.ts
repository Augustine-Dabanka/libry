// Libry's own recommendation algorithm — a transparent, from-scratch ranking
// engine (the "YouTube algorithm" idea, for books). Every published book gets a
// score from real signals, so the best and most-loved books rise, and it tilts
// toward the categories a given reader actually reads.
//
// score =  quality      (rating)
//        + reach        (how many distinct readers)      [log-damped]
//        + stickiness   (share of readers who finished)
//        + social proof (review count)                   [log-damped]
//        + freshness    (small boost for newer catalogue)
//        + affinity     (boost when it matches your taste)

export type BookSignals = { readers: number; finishers: number; reviews: number };

export type RankableBook = {
  id: number | string;
  rating?: number | null;
  category?: string | null;
};

const W = {
  quality: 2.4,
  reach: 1.6,
  stickiness: 1.4,
  social: 1.0,
  freshness: 0.4,
  affinity: 0.8,
};

export function scoreBook(
  b: RankableBook,
  s: BookSignals,
  opts: { affinity?: Set<string> } = {}
): number {
  const quality = (Number(b.rating) || 0) / 5; // 0..1
  const reach = Math.log10((s.readers || 0) + 1); // 0..~
  const stickiness = s.readers > 0 ? s.finishers / s.readers : 0; // 0..1
  const social = Math.log10((s.reviews || 0) + 1); // 0..~
  // Newer catalogue (interactive originals 2xx, classics 3xx, paid originals 4xx)
  // gets a gentle freshness nudge so the shelf doesn't ossify.
  const idn = Number(b.id) || 0;
  const freshness = idn >= 400 ? 1 : idn >= 200 ? 0.6 : 0;
  const affinity = opts.affinity && b.category && opts.affinity.has(b.category) ? 1 : 0;

  return (
    W.quality * quality +
    W.reach * reach +
    W.stickiness * stickiness +
    W.social * social +
    W.freshness * freshness +
    W.affinity * affinity
  );
}

// Rank a list of books, highest score first.
export function rankBooks<T extends RankableBook>(
  books: T[],
  signals: Map<number, BookSignals>,
  opts: { affinity?: Set<string> } = {}
): T[] {
  const empty: BookSignals = { readers: 0, finishers: 0, reviews: 0 };
  return [...books]
    .map((b) => ({ b, score: scoreBook(b, signals.get(Number(b.id)) ?? empty, opts) }))
    .sort((x, y) => y.score - x.score)
    .map((x) => x.b);
}

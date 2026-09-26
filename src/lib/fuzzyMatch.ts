const WORD_START = /[\\/\-_. ]/;

// Scores `query` as an in-order subsequence of `target`; null means no match.
// Consecutive characters and matches at word starts score higher, long gaps score lower.
export function fuzzyScore(query: string, target: string): number | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let score = 0;
  let from = 0;
  let prev = -2;
  for (const ch of q) {
    if (ch === " ") continue;
    const idx = t.indexOf(ch, from);
    if (idx < 0) return null;
    score += 1;
    if (idx === prev + 1) score += 4;
    if (idx === 0 || WORD_START.test(t[idx - 1])) score += 3;
    score -= Math.min(idx - from, 5) * 0.2;
    prev = idx;
    from = idx + 1;
  }
  return score;
}

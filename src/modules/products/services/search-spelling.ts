// Restricted Damerau-Levenshtein distance includes swapped adjacent letters.
export function spellingDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) rows[i][0] = i;
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    rows[i][j] = Math.min(rows[i-1][j]+1, rows[i][j-1]+1, rows[i-1][j-1]+(a[i-1] === b[j-1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i-1] === b[j-2] && a[i-2] === b[j-1]) rows[i][j] = Math.min(rows[i][j], rows[i-2][j-2]+1);
  }
  return rows[a.length][b.length];
}

export function correctSearch(search: string, vocabulary: string[]): string {
  const words = new Map<string, number>();
  for (const text of vocabulary) for (const word of text.toLowerCase().match(/[a-z]{3,}/g) || []) words.set(word, (words.get(word) || 0) + 1);
  return search.toLowerCase().replace(/[a-z]{4,}/g, token => {
    if (words.has(token)) return token;
    let best = token, distance = token.length >= 7 ? 3 : 2, frequency = 0;
    for (const [word, count] of words) {
      if (Math.abs(word.length-token.length) > 2) continue;
      const score = spellingDistance(token, word);
      if (score < distance || (score === distance && best !== token && count > frequency)) { best = word; distance = score; frequency = count; }
    }
    return best;
  });
}

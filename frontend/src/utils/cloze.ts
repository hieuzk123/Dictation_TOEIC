import type { TokenItem, ClozeDensity } from '../types';

/**
 * Calculates which token indices should be blanked based on cloze density (30%, 50%, 70%).
 * Prioritizes keyword tokens first, then expands or trims to meet the target blank count.
 */
export function calculateBlankIndices(tokens: TokenItem[], density: ClozeDensity): Set<number> {
  if (!tokens || tokens.length === 0) return new Set();

  const totalTokens = tokens.length;
  // Calculate target blank count: e.g. 10 tokens @ 30% -> 3, @ 50% -> 5, @ 70% -> 7
  const targetCount = Math.max(1, Math.min(totalTokens, Math.round((totalTokens * density) / 100)));

  // Separate keyword indices and non-keyword indices
  const keywordIndices: number[] = [];
  const otherIndices: number[] = [];

  tokens.forEach((tok, idx) => {
    const isKey = Boolean(tok.is_keyword ?? tok.isKeyword);
    // Ignore pure punctuation tokens if any
    const isWord = /[a-zA-Z0-9]/.test(tok.word || '');
    if (isKey) {
      keywordIndices.push(idx);
    } else if (isWord) {
      otherIndices.push(idx);
    } else {
      // Punctuation or empty
      otherIndices.push(idx);
    }
  });

  const selected = new Set<number>();

  if (keywordIndices.length >= targetCount) {
    // Pick evenly distributed keywords or the first targetCount keywords
    const step = keywordIndices.length / targetCount;
    for (let i = 0; i < targetCount; i++) {
      const indexInKeywords = Math.min(Math.floor(i * step), keywordIndices.length - 1);
      selected.add(keywordIndices[indexInKeywords]);
    }
    // If rounding caused fewer than targetCount due to duplicate indices:
    if (selected.size < targetCount) {
      for (const idx of keywordIndices) {
        selected.add(idx);
        if (selected.size >= targetCount) break;
      }
    }
  } else {
    // Take all keywords
    keywordIndices.forEach((idx) => selected.add(idx));
    // Add additional tokens from otherIndices until targetCount is met
    for (const idx of otherIndices) {
      if (selected.size >= targetCount) break;
      selected.add(idx);
    }
  }

  return selected;
}

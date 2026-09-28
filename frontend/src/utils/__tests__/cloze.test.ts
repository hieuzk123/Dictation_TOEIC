import { describe, it, expect } from 'vitest';
import { calculateBlankIndices } from '../cloze';
import type { TokenItem } from '../../types';

describe('calculateBlankIndices', () => {
  const sampleTokens: TokenItem[] = [
    { word: 'Mark', isKeyword: true },
    { word: 'did', isKeyword: false },
    { word: 'you', isKeyword: false },
    { word: 'order', isKeyword: true },
    { word: 'the', isKeyword: false },
    { word: 'toner', isKeyword: true },
    { word: 'cartridges', isKeyword: true },
    { word: 'for', isKeyword: false },
    { word: 'our', isKeyword: false },
    { word: 'printer', isKeyword: true },
  ]; // 10 tokens total, 5 keywords (indices: 0, 3, 5, 6, 9)

  it('should return approximately 30% blanks (3 blanks out of 10)', () => {
    const blanks = calculateBlankIndices(sampleTokens, 30);
    expect(blanks.size).toBe(3);
    // All selected blanks should be from keywords since there are 5 keywords
    for (const idx of blanks) {
      expect(sampleTokens[idx].isKeyword).toBe(true);
    }
  });

  it('should return approximately 50% blanks (5 blanks out of 10)', () => {
    const blanks = calculateBlankIndices(sampleTokens, 50);
    expect(blanks.size).toBe(5);
    // Should match the 5 keywords
    expect(blanks.has(0)).toBe(true);
    expect(blanks.has(3)).toBe(true);
    expect(blanks.has(5)).toBe(true);
    expect(blanks.has(6)).toBe(true);
    expect(blanks.has(9)).toBe(true);
  });

  it('should return approximately 70% blanks (7 blanks out of 10)', () => {
    const blanks = calculateBlankIndices(sampleTokens, 70);
    expect(blanks.size).toBe(7);
    // Should include all 5 keywords plus 2 non-keywords
    expect(blanks.has(0)).toBe(true);
    expect(blanks.has(3)).toBe(true);
    expect(blanks.has(5)).toBe(true);
    expect(blanks.has(6)).toBe(true);
    expect(blanks.has(9)).toBe(true);
  });

  it('should handle empty or short token arrays gracefully', () => {
    expect(calculateBlankIndices([], 50).size).toBe(0);
    const single = [{ word: 'Hello', isKeyword: true }];
    expect(calculateBlankIndices(single, 30).size).toBe(1);
  });
});

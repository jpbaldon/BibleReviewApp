import type { BibleBook } from '../types';

/** Minimum non-disabled chapters across enabled books required before scoring is active. */
export const MIN_CHAPTERS_ENABLED_FOR_SCORE = 20;

/** Count chapters that count toward the scoring gate (enabled books, rarity !== disabled). */
export function countEnabledChaptersForScore(books: BibleBook[]): number {
  return books.reduce((total, book) => {
    if (!book.enabled || !book.chapters) return total;
    return total + book.chapters.filter((ch) => ch.rarity !== 'disabled').length;
  }, 0);
}

export function isScoreEnabledForBooks(
  books: BibleBook[],
  minimum = MIN_CHAPTERS_ENABLED_FOR_SCORE,
): boolean {
  return countEnabledChaptersForScore(books) >= minimum;
}

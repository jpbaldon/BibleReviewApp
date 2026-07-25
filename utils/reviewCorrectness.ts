import type { DuplicateLocation } from '../types';

export interface VerseReviewItem {
  book: string;
  chapter: number;
  duplicateLocations?: DuplicateLocation[] | null;
}

/** Exact book + chapter match (used by chapter summary review). */
export function isChapterGuessCorrect(
  book: string,
  chapter: string,
  item: { book: string; chapter: number },
): boolean {
  return book === item.book && parseInt(chapter, 10) === item.chapter;
}

/**
 * Verse review: original location or any duplicate location counts as correct.
 */
export function isVerseGuessCorrect(
  book: string,
  chapter: string,
  item: VerseReviewItem,
): boolean {
  const inputBook = book.trim();
  const inputChapter = parseInt(chapter, 10);

  if (inputBook === item.book && inputChapter === item.chapter) {
    return true;
  }

  if (item.duplicateLocations && Array.isArray(item.duplicateLocations)) {
    return item.duplicateLocations.some(
      (loc) => loc.Book === inputBook && loc.Chapter === inputChapter,
    );
  }

  return false;
}

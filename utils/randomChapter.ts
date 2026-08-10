import { BibleBook, Chapter, Rarity } from '../types';
import { useTimer } from '../context/TimerContext';
import { useBibleBooks } from '../context/BibleBooksContext';
import { filterBooksByScope } from './bibleScope';

export type { Rarity };

export const rarityWeightMap: Record<Rarity, number> = {
  common: 1.0,
  uncommon: 0.5,
  rare: 0.2,
  ultraRare: 0.1,
  disabled: 0.0,
} as const;

export interface WeightedChapter {
  book: string;
  chapterIndex: number;
  chapter: Chapter;
  weight: number;
}

/**
 * Build the weighted chapter pool used for random selection.
 * When `treatAllAsCommon` is true (competitive sessions), rarity is ignored.
 */
export function buildWeightedChapters(
  books: BibleBook[],
  options: { treatAllAsCommon?: boolean } = {},
): WeightedChapter[] {
  const { treatAllAsCommon = false } = options;
  const weightedChapters: WeightedChapter[] = [];

  for (const book of books) {
    if (!book.chapters) continue;

    for (const chapter of book.chapters) {
      const rarity: Rarity =
        !treatAllAsCommon && chapter.rarity ? chapter.rarity : 'common';
      const weight = rarityWeightMap[rarity];

      if (weight > 0) {
        weightedChapters.push({
          book: book.bookName,
          chapterIndex: chapter.chapter,
          chapter,
          weight,
        });
      }
    }
  }

  return weightedChapters;
}

export function useWeightedChapters(enabledBooks: BibleBook[]): WeightedChapter[] {
  const { competitiveTimer } = useTimer();
  const { bibleBooks } = useBibleBooks();

  const inCompetitiveSession = competitiveTimer && competitiveTimer.isActive;
  const allowedBooks = inCompetitiveSession && competitiveTimer.activeScope
    ? filterBooksByScope(bibleBooks, competitiveTimer.activeScope)
    : enabledBooks;

  return buildWeightedChapters(allowedBooks, {
    treatAllAsCommon: !!inCompetitiveSession,
  });
}

export function selectWeightedChapter(chapters: WeightedChapter[]): WeightedChapter {
  if (chapters.length === 0) {
    throw new Error('No eligible chapters.');
  }

  const totalWeight = chapters.reduce((sum, ch) => sum + ch.weight, 0);
  const rand = Math.random() * totalWeight;

  let runningWeight = 0;

  for (const ch of chapters) {
    runningWeight += ch.weight;
    if (rand <= runningWeight) {
      return ch;
    }
  }

  return chapters[0];
}

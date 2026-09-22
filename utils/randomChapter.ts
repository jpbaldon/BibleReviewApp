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

/** Integer copies that preserve rarityWeightMap ratios (weight * 10). */
const RARITY_COPY_SCALE = 10;

function gcd(a: number, b: number): number {
  let x = a;
  let y = b;
  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const deck = items.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const swap = deck[i];
    deck[i] = deck[j];
    deck[j] = swap;
  }
  return deck;
}

/**
 * Draws come from the end of the array. If that next draw is the chapter or
 * verse just shown, swap it with an earlier different item when one exists.
 */
function moveAvoidedOffNextDraw<T>(items: T[], shouldAvoid: (item: T) => boolean): void {
  if (items.length <= 1) return;
  const nextIndex = items.length - 1;
  if (!shouldAvoid(items[nextIndex])) return;
  const swapIndex = items.findIndex((item) => !shouldAvoid(item));
  if (swapIndex === -1) return;
  const swap = items[swapIndex];
  items[swapIndex] = items[nextIndex];
  items[nextIndex] = swap;
}

/**
 * One cycle of the shuffle bag. Copy counts follow rarity weights, then the
 * greatest common divisor is divided out so an all-common pool is a single
 * copy of each chapter.
 */
export function expandWeightedDeck(chapters: WeightedChapter[]): WeightedChapter[] {
  const counted = chapters
    .map((chapter) => ({
      chapter,
      copies: Math.round(chapter.weight * RARITY_COPY_SCALE),
    }))
    .filter((entry) => entry.copies > 0);

  if (counted.length === 0) return [];

  const divisor = counted.reduce((acc, entry) => gcd(acc, entry.copies), 0);
  const deck: WeightedChapter[] = [];
  for (const entry of counted) {
    const copies = entry.copies / divisor;
    for (let i = 0; i < copies; i++) {
      deck.push(entry.chapter);
    }
  }
  return deck;
}

function poolSignature(chapters: WeightedChapter[]): string {
  return chapters
    .map((chapter) => `${chapter.book}\u0000${chapter.chapterIndex}\u0000${chapter.weight}`)
    .join('\n');
}

function isSameChapter(
  chapter: WeightedChapter,
  avoid: { book: string; chapterIndex: number } | null,
): boolean {
  return avoid != null
    && chapter.book === avoid.book
    && chapter.chapterIndex === avoid.chapterIndex;
}

/**
 * Deals chapters without replacement. Sampling with replacement left some
 * chapters unseen for a long stretch even when every chapter was equally
 * common; a full cycle shows each enabled chapter at least once, and more
 * often when its rarity weight is higher.
 */
export function createChapterDeck(random: () => number = Math.random) {
  let remaining: WeightedChapter[] = [];
  let signature = '';
  let last: { book: string; chapterIndex: number } | null = null;

  return {
    draw(chapters: WeightedChapter[]): WeightedChapter {
      if (chapters.length === 0) {
        throw new Error('No eligible chapters.');
      }

      const nextSignature = poolSignature(chapters);
      if (nextSignature !== signature || remaining.length === 0) {
        const expanded = expandWeightedDeck(chapters);
        if (expanded.length === 0) {
          throw new Error('No eligible chapters.');
        }
        const shuffled = shuffle(expanded, random);
        moveAvoidedOffNextDraw(shuffled, (chapter) => isSameChapter(chapter, last));
        remaining = shuffled;
        signature = nextSignature;
      }

      const next = remaining.pop();
      if (!next) {
        throw new Error('No eligible chapters.');
      }
      last = { book: next.book, chapterIndex: next.chapterIndex };
      return next;
    },
  };
}

/**
 * Deals verse indexes inside one chapter without replacement. Each
 * book+chapter keeps its own bag for the life of the deck.
 */
export function createVerseDeck(random: () => number = Math.random) {
  const bags = new Map<string, { remaining: number[]; last: number | null; verseCount: number }>();

  return {
    draw(book: string, chapterIndex: number, verseCount: number): number {
      if (verseCount <= 0) {
        throw new Error('No eligible verses.');
      }

      const key = `${book}\u0000${chapterIndex}`;
      const existing = bags.get(key);
      const countChanged = existing != null && existing.verseCount !== verseCount;
      let bag = existing;

      if (!bag || countChanged || bag.remaining.length === 0) {
        const last = bag && !countChanged ? bag.last : null;
        const order = shuffle(
          Array.from({ length: verseCount }, (_, index) => index),
          random,
        );
        if (last != null) {
          moveAvoidedOffNextDraw(order, (index) => index === last);
        }
        bag = { remaining: order, last, verseCount };
        bags.set(key, bag);
      }

      const next = bag.remaining.pop();
      if (next === undefined) {
        throw new Error('No eligible verses.');
      }
      bag.last = next;
      return next;
    },
  };
}

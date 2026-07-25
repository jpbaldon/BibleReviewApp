import type { BibleBook, Chapter } from '../types';
import {
  MIN_CHAPTERS_ENABLED_FOR_SCORE,
  countEnabledChaptersForScore,
  isScoreEnabledForBooks,
} from './scoreGate';

function chapter(num: number, rarity?: Chapter['rarity']): Chapter {
  return {
    chapter: num,
    verses: [{ verseNumber: 1, text: 't', duplicateLocations: [] }],
    ...(rarity ? { rarity } : {}),
  };
}

function book(
  name: string,
  enabled: boolean,
  chapters: Chapter[],
): BibleBook {
  return { bookName: name, enabled, chapters };
}

describe('scoreGate', () => {
  it('exposes the expected minimum chapter threshold', () => {
    expect(MIN_CHAPTERS_ENABLED_FOR_SCORE).toBe(20);
  });

  it('counts only enabled books and non-disabled chapters', () => {
    const books = [
      book('Genesis', true, [
        chapter(1),
        chapter(2, 'rare'),
        chapter(3, 'disabled'),
      ]),
      book('Exodus', false, [chapter(1), chapter(2)]),
      book('Leviticus', true, []),
      { bookName: 'Numbers', enabled: true },
    ];

    expect(countEnabledChaptersForScore(books)).toBe(2);
  });

  it('enables scoring at the threshold', () => {
    const chapters = Array.from({ length: 20 }, (_, i) => chapter(i + 1));
    const books = [book('Psalms', true, chapters)];

    expect(isScoreEnabledForBooks(books)).toBe(true);
    expect(isScoreEnabledForBooks(books, 21)).toBe(false);
  });

  it('stays disabled below the threshold even with disabled chapters present', () => {
    const chapters = [
      ...Array.from({ length: 19 }, (_, i) => chapter(i + 1)),
      chapter(20, 'disabled'),
    ];
    const books = [book('Psalms', true, chapters)];

    expect(countEnabledChaptersForScore(books)).toBe(19);
    expect(isScoreEnabledForBooks(books)).toBe(false);
  });
});

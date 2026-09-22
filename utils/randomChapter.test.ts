import type { BibleBook, Chapter } from '../types';
import {
  buildWeightedChapters,
  createChapterDeck,
  createVerseDeck,
  expandWeightedDeck,
  rarityWeightMap,
} from './randomChapter';

function chapter(
  chapterNum: number,
  rarity?: Chapter['rarity'],
): Chapter {
  return {
    chapter: chapterNum,
    verses: [{ verseNumber: 1, text: 'v1', duplicateLocations: [] }],
    ...(rarity ? { rarity } : {}),
  };
}

function book(name: string, chapters: Chapter[], enabled = true): BibleBook {
  return { bookName: name, enabled, chapters };
}

describe('rarityWeightMap', () => {
  it('maps rarities to expected weights', () => {
    expect(rarityWeightMap.common).toBe(1);
    expect(rarityWeightMap.uncommon).toBe(0.5);
    expect(rarityWeightMap.rare).toBe(0.2);
    expect(rarityWeightMap.ultraRare).toBe(0.1);
    expect(rarityWeightMap.disabled).toBe(0);
  });
});

describe('buildWeightedChapters', () => {
  it('skips books without chapters and disabled rarity', () => {
    const weighted = buildWeightedChapters([
      book('Genesis', [
        chapter(1, 'common'),
        chapter(2, 'disabled'),
      ]),
      { bookName: 'Empty', enabled: true },
    ]);

    expect(weighted).toHaveLength(1);
    expect(weighted[0]).toMatchObject({
      book: 'Genesis',
      chapterIndex: 1,
      weight: 1,
    });
  });

  it('applies rarity weights when not treating all as common', () => {
    const weighted = buildWeightedChapters([
      book('Genesis', [
        chapter(1, 'common'),
        chapter(2, 'uncommon'),
        chapter(3, 'rare'),
        chapter(4, 'ultraRare'),
      ]),
    ]);

    expect(weighted.map((c) => c.weight)).toEqual([1, 0.5, 0.2, 0.1]);
  });

  it('treats all chapters as common when treatAllAsCommon is true', () => {
    const weighted = buildWeightedChapters(
      [
        book('Genesis', [
          chapter(1, 'rare'),
          chapter(2, 'disabled'),
        ]),
      ],
      { treatAllAsCommon: true },
    );

    expect(weighted).toHaveLength(2);
    expect(weighted.every((c) => c.weight === 1)).toBe(true);
  });

  it('defaults missing rarity to common', () => {
    const weighted = buildWeightedChapters([book('John', [chapter(1)])]);
    expect(weighted[0].weight).toBe(1);
  });
});

describe('expandWeightedDeck', () => {
  it('uses one copy of each chapter when every weight is equal', () => {
    const pool = buildWeightedChapters([
      book('Genesis', Array.from({ length: 20 }, (_, index) => chapter(index + 1, 'common'))),
    ]);

    expect(expandWeightedDeck(pool)).toHaveLength(20);
  });

  it('keeps rarity ratios after dividing out the greatest common divisor', () => {
    const pool = buildWeightedChapters([
      book('Genesis', [
        chapter(1, 'common'),
        chapter(2, 'uncommon'),
        chapter(3, 'rare'),
        chapter(4, 'ultraRare'),
        chapter(5, 'disabled'),
      ]),
    ]);

    const counts = new Map<number, number>();
    for (const entry of expandWeightedDeck(pool)) {
      counts.set(entry.chapterIndex, (counts.get(entry.chapterIndex) ?? 0) + 1);
    }

    expect(counts.get(1)).toBe(10);
    expect(counts.get(2)).toBe(5);
    expect(counts.get(3)).toBe(2);
    expect(counts.get(4)).toBe(1);
    expect(counts.has(5)).toBe(false);
  });
});

describe('createChapterDeck', () => {
  function sequenceRandom(values: number[]) {
    let index = 0;
    return () => {
      const value = values[index];
      index += 1;
      return value;
    };
  }

  it('throws when the pool is empty', () => {
    expect(() => createChapterDeck().draw([])).toThrow('No eligible chapters.');
  });

  it('shows every equally weighted chapter once before repeating', () => {
    const pool = buildWeightedChapters([
      book('Genesis', Array.from({ length: 20 }, (_, index) => chapter(index + 1, 'common'))),
    ]);
    const deck = createChapterDeck();
    const seen = new Set<number>();

    for (let i = 0; i < pool.length; i++) {
      seen.add(deck.draw(pool).chapterIndex);
    }

    expect(seen.size).toBe(20);
  });

  it('deals each rarity its normalized number of times per cycle', () => {
    const pool = buildWeightedChapters([
      book('Genesis', [
        chapter(1, 'common'),
        chapter(2, 'uncommon'),
        chapter(3, 'rare'),
        chapter(4, 'ultraRare'),
      ]),
    ]);
    const deck = createChapterDeck();
    const counts = new Map<number, number>();
    const cycleLength = expandWeightedDeck(pool).length;

    for (let i = 0; i < cycleLength; i++) {
      const drawn = deck.draw(pool);
      counts.set(drawn.chapterIndex, (counts.get(drawn.chapterIndex) ?? 0) + 1);
    }

    expect(counts.get(1)).toBe(10);
    expect(counts.get(2)).toBe(5);
    expect(counts.get(3)).toBe(2);
    expect(counts.get(4)).toBe(1);
  });

  it('does not open a refill with the chapter just drawn', () => {
    const pool = buildWeightedChapters([
      book('Genesis', [chapter(1, 'common'), chapter(2, 'common')]),
    ]);
    // Identity shuffle deals chapter 2 then 1. The refill shuffle would put
    // chapter 1 next, and the deck swaps that away.
    const deck = createChapterDeck(sequenceRandom([0.99, 0]));
    const firstCycle = [deck.draw(pool).chapterIndex, deck.draw(pool).chapterIndex];

    expect(firstCycle).toEqual([2, 1]);
    expect(deck.draw(pool).chapterIndex).toBe(2);
  });

  it('starts a fresh deck when the pool changes', () => {
    const firstPool = buildWeightedChapters([
      book('Genesis', [chapter(1, 'common'), chapter(2, 'common')]),
    ]);
    const secondPool = buildWeightedChapters([
      book('Exodus', [chapter(3, 'common')]),
    ]);
    const deck = createChapterDeck(() => 0.99);

    deck.draw(firstPool);

    expect(deck.draw(secondPool).book).toBe('Exodus');
  });
});

describe('createVerseDeck', () => {
  function sequenceRandom(values: number[]) {
    let index = 0;
    return () => {
      const value = values[index];
      index += 1;
      return value;
    };
  }

  it('throws when a chapter has no verses', () => {
    expect(() => createVerseDeck().draw('John', 1, 0)).toThrow('No eligible verses.');
  });

  it('shows every verse once before repeating', () => {
    const deck = createVerseDeck();
    const seen = new Set<number>();

    for (let i = 0; i < 5; i++) {
      seen.add(deck.draw('John', 3, 5));
    }

    expect(seen).toEqual(new Set([0, 1, 2, 3, 4]));
  });

  it('does not open a refill with the verse just drawn', () => {
    const deck = createVerseDeck(sequenceRandom([0.99, 0]));
    const firstCycle = [deck.draw('John', 1, 2), deck.draw('John', 1, 2)];

    expect(firstCycle).toEqual([1, 0]);
    expect(deck.draw('John', 1, 2)).toBe(1);
  });

  it('keeps a separate bag for each chapter', () => {
    const deck = createVerseDeck(() => 0);
    deck.draw('John', 1, 2);

    expect(deck.draw('John', 2, 2)).toBe(0);
    expect(deck.draw('John', 1, 2)).toBe(1);
  });
});

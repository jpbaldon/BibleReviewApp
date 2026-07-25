import type { BibleBook, Chapter } from '../types';
import {
  buildWeightedChapters,
  rarityWeightMap,
  selectWeightedChapter,
  type WeightedChapter,
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

describe('selectWeightedChapter', () => {
  const pool: WeightedChapter[] = [
    {
      book: 'A',
      chapterIndex: 1,
      chapter: chapter(1, 'common'),
      weight: 1,
    },
    {
      book: 'B',
      chapterIndex: 2,
      chapter: chapter(2, 'common'),
      weight: 1,
    },
  ];

  afterEach(() => {
    jest.spyOn(Math, 'random').mockRestore();
  });

  it('throws when the pool is empty', () => {
    expect(() => selectWeightedChapter([])).toThrow('No eligible chapters.');
  });

  it('selects the first chapter when rand is in its weight range', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    expect(selectWeightedChapter(pool).book).toBe('A');
  });

  it('selects the second chapter when rand falls in its range', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.75);
    expect(selectWeightedChapter(pool).book).toBe('B');
  });

  it('falls back to the first chapter if nothing matches', () => {
    const single = [pool[0]];
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(selectWeightedChapter(single)).toBe(single[0]);
  });
});

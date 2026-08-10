import {
  emptyChampionCelebrated,
  parseChampionCelebrated,
} from './competitiveStorage';

describe('parseChampionCelebrated', () => {
  it('returns all false when storage is empty or invalid', () => {
    expect(parseChampionCelebrated(null)).toEqual(emptyChampionCelebrated());
    expect(parseChampionCelebrated('not-json')).toEqual(emptyChampionCelebrated());
  });

  it('reads per-scope celebration flags', () => {
    expect(
      parseChampionCelebrated(JSON.stringify({ full: true, ot: false, nt: true })),
    ).toEqual({
      full: true,
      ot: false,
      nt: true,
    });
  });
});

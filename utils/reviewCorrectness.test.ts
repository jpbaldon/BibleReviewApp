import { isChapterGuessCorrect, isVerseGuessCorrect } from './reviewCorrectness';

describe('isChapterGuessCorrect', () => {
  const item = { book: 'Genesis', chapter: 3 };

  it('returns true for an exact book and chapter match', () => {
    expect(isChapterGuessCorrect('Genesis', '3', item)).toBe(true);
  });

  it('returns false for wrong book or chapter', () => {
    expect(isChapterGuessCorrect('Exodus', '3', item)).toBe(false);
    expect(isChapterGuessCorrect('Genesis', '2', item)).toBe(false);
  });
});

describe('isVerseGuessCorrect', () => {
  const item = {
    book: 'Matthew',
    chapter: 5,
    duplicateLocations: [
      { Book: 'Luke', Chapter: 6, Verse: 20 },
    ],
  };

  it('accepts the original location', () => {
    expect(isVerseGuessCorrect('Matthew', '5', item)).toBe(true);
  });

  it('trims book input before comparing', () => {
    expect(isVerseGuessCorrect('  Matthew  ', '5', item)).toBe(true);
  });

  it('accepts a duplicate location', () => {
    expect(isVerseGuessCorrect('Luke', '6', item)).toBe(true);
  });

  it('rejects unrelated guesses', () => {
    expect(isVerseGuessCorrect('John', '1', item)).toBe(false);
  });

  it('works when duplicateLocations is missing', () => {
    expect(
      isVerseGuessCorrect('Matthew', '5', { book: 'Matthew', chapter: 5 }),
    ).toBe(true);
    expect(
      isVerseGuessCorrect('Luke', '6', { book: 'Matthew', chapter: 5 }),
    ).toBe(false);
  });

  it('rejects non-numeric chapter input', () => {
    expect(isVerseGuessCorrect('Matthew', 'abc', item)).toBe(false);
  });

  it('rejects empty duplicateLocations arrays for non-original guesses', () => {
    expect(
      isVerseGuessCorrect('Luke', '6', {
        book: 'Matthew',
        chapter: 5,
        duplicateLocations: [],
      }),
    ).toBe(false);
  });
});

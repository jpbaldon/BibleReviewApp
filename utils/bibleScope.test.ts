import {
  COMPETITIVE_SCOPES,
  competitiveDurationSeconds,
  filterBooksByScope,
  isNewTestamentBook,
} from './bibleScope';
import type { BibleBook } from '../types';

function book(name: string): BibleBook {
  return { bookName: name, enabled: true, chapters: [{ chapter: 1, verses: [] }] };
}

describe('isNewTestamentBook', () => {
  it('classifies OT and NT boundaries', () => {
    expect(isNewTestamentBook('Genesis')).toBe(false);
    expect(isNewTestamentBook('Malachi')).toBe(false);
    expect(isNewTestamentBook('Matthew')).toBe(true);
    expect(isNewTestamentBook('Revelation')).toBe(true);
  });
});

describe('filterBooksByScope', () => {
  const books = [book('Genesis'), book('Malachi'), book('Matthew'), book('John')];

  it('returns all books for full scope', () => {
    expect(filterBooksByScope(books, 'full')).toHaveLength(4);
  });

  it('returns only OT books', () => {
    const ot = filterBooksByScope(books, 'ot');
    expect(ot.map((b) => b.bookName)).toEqual(['Genesis', 'Malachi']);
  });

  it('returns only NT books', () => {
    const nt = filterBooksByScope(books, 'nt');
    expect(nt.map((b) => b.bookName)).toEqual(['Matthew', 'John']);
  });

  it('covers every competitive scope', () => {
    for (const scope of COMPETITIVE_SCOPES) {
      expect(filterBooksByScope(books, scope).length).toBeGreaterThan(0);
    }
  });
});

describe('competitiveDurationSeconds', () => {
  it('uses 5 minutes for full bible and 3 minutes for OT/NT', () => {
    expect(competitiveDurationSeconds('full')).toBe(300);
    expect(competitiveDurationSeconds('ot')).toBe(180);
    expect(competitiveDurationSeconds('nt')).toBe(180);
  });
});

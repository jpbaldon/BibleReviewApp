import { parseSpokenBibleReference } from './parseSpokenBibleReference';
import { ALL_BIBLE_BOOKS } from './bibleBookAliases';

const enabledBooks = [...ALL_BIBLE_BOOKS];

describe('parseSpokenBibleReference', () => {
  it('parses "John chapter 3"', () => {
    const result = parseSpokenBibleReference('John chapter 3', enabledBooks);
    expect(result).toEqual({
      success: true,
      reference: { book: 'John', chapter: '3' },
    });
  });

  it('parses "john 3" without the word chapter', () => {
    const result = parseSpokenBibleReference('john 3', enabledBooks);
    expect(result).toEqual({
      success: true,
      reference: { book: 'John', chapter: '3' },
    });
  });

  it('parses numbered books with spelled-out ordinals', () => {
    const result = parseSpokenBibleReference('first corinthians thirteen', enabledBooks);
    expect(result).toEqual({
      success: true,
      reference: { book: '1 Corinthians', chapter: '13' },
    });
  });

  it('parses "1 Corinthians 13"', () => {
    const result = parseSpokenBibleReference('1 Corinthians 13', enabledBooks);
    expect(result).toEqual({
      success: true,
      reference: { book: '1 Corinthians', chapter: '13' },
    });
  });

  it('parses Psalm aliases', () => {
    const result = parseSpokenBibleReference('psalm twenty three', enabledBooks);
    expect(result).toEqual({
      success: true,
      reference: { book: 'Psalms', chapter: '23' },
    });
  });

  it('parses Song of Solomon aliases', () => {
    const result = parseSpokenBibleReference('song of songs chapter 2', enabledBooks);
    expect(result).toEqual({
      success: true,
      reference: { book: 'Song of Solomon', chapter: '2' },
    });
  });

  it('defaults single-chapter books to chapter 1', () => {
    const result = parseSpokenBibleReference('Jude', enabledBooks);
    expect(result).toEqual({
      success: true,
      reference: { book: 'Jude', chapter: '1' },
    });
  });

  it('parses three john as a book name, not John chapter 3', () => {
    const result = parseSpokenBibleReference('3 John', enabledBooks);
    expect(result).toEqual({
      success: true,
      reference: { book: '3 John', chapter: '1' },
    });
  });

  it('rejects books that are not enabled', () => {
    const result = parseSpokenBibleReference('John 3', ['Genesis']);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('John is not enabled for review.');
    }
  });

  it('rejects speech that matches no Bible book', () => {
    const result = parseSpokenBibleReference('xyzzy 3', enabledBooks);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/could not recognize/i);
    }
  });

  it('reports missing chapter for multi-chapter books', () => {
    const result = parseSpokenBibleReference('Genesis', enabledBooks);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/no chapter/i);
    }
  });

  it('rejects empty input', () => {
    const result = parseSpokenBibleReference('   ', enabledBooks);
    expect(result.success).toBe(false);
  });

  it('parses omitted-hundred chapters like "one thirty-six"', () => {
    const result = parseSpokenBibleReference('Psalms one thirty-six', enabledBooks);
    expect(result).toEqual({
      success: true,
      reference: { book: 'Psalms', chapter: '136' },
    });
  });

  it('parses "one hundred thirty six"', () => {
    const result = parseSpokenBibleReference('Psalms one hundred thirty six', enabledBooks);
    expect(result).toEqual({
      success: true,
      reference: { book: 'Psalms', chapter: '136' },
    });
  });

  it('parses "psalm one nineteen"', () => {
    const result = parseSpokenBibleReference('psalm one nineteen', enabledBooks);
    expect(result).toEqual({
      success: true,
      reference: { book: 'Psalms', chapter: '119' },
    });
  });
});

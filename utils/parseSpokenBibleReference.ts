import {
  ALL_BIBLE_BOOKS,
  buildBookAliasLookup,
  SINGLE_CHAPTER_BOOKS,
} from './bibleBookAliases';

export interface ParsedBibleReference {
  book: string;
  chapter: string;
}

export type ParseSpokenReferenceResult =
  | { success: true; reference: ParsedBibleReference }
  | { success: false; error: string };

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  for: 4,
  fore: 4,
  to: 2,
  too: 2,
  won: 1,
  ate: 8,
};

const MAX_CHAPTER_WORDS = 4;

function normalizeTranscript(transcript: string): string {
  return transcript
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/-/g, ' ')
    .replace(/[.,!?;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTwoDigitPhrase(words: string[]): number | null {
  if (words.length === 1) {
    const value = NUMBER_WORDS[words[0]];
    if (value !== undefined && value >= 10 && value < 100) {
      return value;
    }
    return null;
  }

  if (words.length === 2) {
    const tens = NUMBER_WORDS[words[0]];
    const ones = NUMBER_WORDS[words[1]];
    if (tens !== undefined && ones !== undefined && tens >= 20 && ones > 0 && ones < 10) {
      return tens + ones;
    }
  }

  return null;
}

function parseChapterPhrase(phrase: string): number | null {
  const trimmed = phrase.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    const value = parseInt(trimmed, 10);
    return value > 0 ? value : null;
  }

  if (NUMBER_WORDS[trimmed] !== undefined && NUMBER_WORDS[trimmed] > 0) {
    return NUMBER_WORDS[trimmed];
  }

  const words = trimmed.split(/\s+/);
  const twoDigit = parseTwoDigitPhrase(words);
  if (twoDigit !== null) {
    return twoDigit;
  }

  if (words.length >= 2 && words[1] === 'hundred') {
    const hundreds = NUMBER_WORDS[words[0]];
    if (hundreds !== undefined && hundreds >= 1 && hundreds <= 9) {
      if (words.length === 2) {
        return hundreds * 100;
      }
      const remainder = parseChapterPhrase(words.slice(2).join(' '));
      if (remainder !== null && remainder < 100) {
        return hundreds * 100 + remainder;
      }
    }
  }

  if (words.length >= 2 && words[1] !== 'hundred') {
    const hundreds = NUMBER_WORDS[words[0]];
    if (hundreds !== undefined && hundreds >= 1 && hundreds <= 9) {
      const remainder = parseTwoDigitPhrase(words.slice(1));
      if (remainder !== null) {
        return hundreds * 100 + remainder;
      }
    }
  }

  return null;
}

function extractChapter(text: string): { bookPart: string; chapter: number | null } {
  const chapterKeywordMatch = text.match(/^(.+?)\s+(?:chapter|ch)\s+(.+)$/);
  if (chapterKeywordMatch) {
    const chapter = parseChapterPhrase(chapterKeywordMatch[2]);
    if (chapter !== null) {
      return { bookPart: chapterKeywordMatch[1].trim(), chapter };
    }
  }

  const words = text.split(/\s+/).filter(Boolean);
  for (let take = Math.min(MAX_CHAPTER_WORDS, words.length - 1); take >= 1; take -= 1) {
    const chapterWords = words.slice(-take).join(' ');
    const chapter = parseChapterPhrase(chapterWords);
    if (chapter !== null) {
      return {
        bookPart: words.slice(0, -take).join(' '),
        chapter,
      };
    }
  }

  return { bookPart: text.trim(), chapter: null };
}

function stripBookPrefixes(text: string): string {
  return text
    .replace(/^the\s+book\s+of\s+/, '')
    .replace(/^book\s+of\s+/, '')
    .trim();
}

function matchBook(
  bookPart: string,
  aliasLookup: Map<string, string>,
  books: string[],
): string | null {
  const normalized = stripBookPrefixes(bookPart).replace(/\s+/g, ' ');

  if (aliasLookup.has(normalized)) {
    return aliasLookup.get(normalized)!;
  }

  const candidates = books
    .flatMap((book) => {
      const aliases = [...aliasLookup.entries()]
        .filter(([, canonical]) => canonical === book)
        .map(([alias]) => alias);
      return aliases.map((alias) => ({ book, alias }));
    })
    .sort((a, b) => b.alias.length - a.alias.length);

  for (const { book, alias } of candidates) {
    if (normalized === alias) {
      return book;
    }
  }

  return null;
}

/**
 * Parse a speech transcript into a canonical book name and chapter number.
 * Only books present in `enabledBooks` are accepted as answers.
 */
export function parseSpokenBibleReference(
  transcript: string,
  enabledBooks: string[],
): ParseSpokenReferenceResult {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return { success: false, error: 'No speech detected. Try again.' };
  }

  if (enabledBooks.length === 0) {
    return { success: false, error: 'No books are enabled for review.' };
  }

  const normalized = normalizeTranscript(trimmed);
  const aliasLookup = buildBookAliasLookup(enabledBooks);
  const { bookPart, chapter } = extractChapter(normalized);
  const book = matchBook(bookPart, aliasLookup, enabledBooks);

  if (!book) {
    const allBooks = [...ALL_BIBLE_BOOKS];
    const canonBook = matchBook(
      bookPart,
      buildBookAliasLookup(allBooks),
      allBooks,
    );
    if (canonBook) {
      return {
        success: false,
        error: `${canonBook} is not enabled for review.`,
      };
    }

    return {
      success: false,
      error: `Could not recognize "${bookPart}". Try the picker or speak again.`,
    };
  }

  let resolvedChapter = chapter;
  if (resolvedChapter === null && SINGLE_CHAPTER_BOOKS.has(book)) {
    resolvedChapter = 1;
  }

  if (resolvedChapter === null) {
    return {
      success: false,
      error: `Recognized ${book}, but no chapter. Say something like "${book} chapter 3".`,
    };
  }

  return {
    success: true,
    reference: {
      book,
      chapter: String(resolvedChapter),
    },
  };
}

import type { BibleBook } from '../types';

export const COMPETITIVE_SCOPES = ['full', 'ot', 'nt'] as const;
export type CompetitiveScope = (typeof COMPETITIVE_SCOPES)[number];

/** First NT book in the bundled Protestant canon order. */
export const FIRST_NT_BOOK = 'Matthew';

export const COMPETITIVE_SCOPE_LABELS: Record<CompetitiveScope, string> = {
  full: 'Full Bible',
  ot: 'Old Testament',
  nt: 'New Testament',
};

export const COMPETITIVE_SCOPE_SHORT_LABELS: Record<CompetitiveScope, string> = {
  full: 'Full Bible',
  ot: 'OT',
  nt: 'NT',
};

export const COMPETITIVE_DURATION_SECONDS: Record<CompetitiveScope, number> = {
  full: 300,
  ot: 180,
  nt: 180,
};

export function competitiveDurationSeconds(scope: CompetitiveScope): number {
  return COMPETITIVE_DURATION_SECONDS[scope];
}

export function competitiveDurationLabel(scope: CompetitiveScope): string {
  const minutes = COMPETITIVE_DURATION_SECONDS[scope] / 60;
  return `${minutes}-Minute Challenge`;
}

export function competitiveBannerLabel(scope: CompetitiveScope): string {
  switch (scope) {
    case 'ot':
      return 'Competitive (OT)';
    case 'nt':
      return 'Competitive (NT)';
    default:
      return 'Competitive';
  }
}

export function isNewTestamentBook(bookName: string): boolean {
  const books = getCanonicalBookOrder();
  const index = books.indexOf(bookName);
  if (index === -1) return false;
  return index >= books.indexOf(FIRST_NT_BOOK);
}

export function filterBooksByScope(
  books: BibleBook[],
  scope: CompetitiveScope,
): BibleBook[] {
  if (scope === 'full') return books;
  return books.filter((book) =>
    scope === 'nt'
      ? isNewTestamentBook(book.bookName)
      : !isNewTestamentBook(book.bookName),
  );
}

let cachedBookOrder: string[] | null = null;

function getCanonicalBookOrder(): string[] {
  if (cachedBookOrder) return cachedBookOrder;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BSB } = require('../data/bsb') as {
      Bible: { Book: string }[];
    };
    cachedBookOrder = BSB.Bible.map((entry) => entry.Book);
  } catch {
    cachedBookOrder = [];
  }
  return cachedBookOrder;
}

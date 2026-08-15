/** Canonical Bible book names and speech/abbreviation aliases for voice parsing. */

export const ALL_BIBLE_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms',
  'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah',
  'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
  'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai',
  'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
  'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
  '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus',
  'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation',
] as const;

/** Books with only one chapter when the user omits a chapter number. */
export const SINGLE_CHAPTER_BOOKS = new Set([
  'Obadiah', 'Philemon', '2 John', '3 John', 'Jude',
]);

const BOOK_ABBREVIATIONS: Record<string, string[]> = {
  Genesis: ['gen'],
  Exodus: ['exo'],
  Leviticus: ['lev'],
  Numbers: ['num'],
  Deuteronomy: ['deut'],
  Joshua: ['josh'],
  Judges: ['judg'],
  Ruth: ['ruth'],
  '1 Samuel': ['1sa', '1 sam'],
  '2 Samuel': ['2sa', '2 sam'],
  '1 Kings': ['1ki', '1 kin'],
  '2 Kings': ['2ki', '2 kin'],
  '1 Chronicles': ['1ch', '1 chr'],
  '2 Chronicles': ['2ch', '2 chr'],
  Ezra: ['ezr'],
  Nehemiah: ['neh'],
  Esther: ['est'],
  Job: ['job'],
  Psalms: ['psalm', 'ps', 'psa'],
  Proverbs: ['prov'],
  Ecclesiastes: ['ecc'],
  'Song of Solomon': ['song of songs', 'songs', 'song', 'sos'],
  Isaiah: ['isa'],
  Jeremiah: ['jer'],
  Lamentations: ['lam'],
  Ezekiel: ['ezek'],
  Daniel: ['dan'],
  Hosea: ['hos'],
  Joel: ['joel'],
  Amos: ['amos'],
  Obadiah: ['obad'],
  Jonah: ['jon'],
  Micah: ['mic'],
  Nahum: ['nah'],
  Habakkuk: ['hab'],
  Zephaniah: ['zeph'],
  Haggai: ['hag'],
  Zechariah: ['zech'],
  Malachi: ['mal'],
  Matthew: ['matt', 'mat'],
  Mark: ['mark'],
  Luke: ['luke'],
  John: ['john'],
  Acts: ['acts', 'ask', 'asked', 'act', 'axe', 'ax', 'acts of the apostles'],
  Romans: ['rom'],
  '1 Corinthians': ['1co', '1 cor'],
  '2 Corinthians': ['2co', '2 cor'],
  Galatians: ['gal'],
  Ephesians: ['eph'],
  Philippians: ['phil', 'phillipians', 'philippians'],
  Colossians: ['col'],
  '1 Thessalonians': ['1th', '1 thess', '1 thes'],
  '2 Thessalonians': ['2th', '2 thess', '2 thes'],
  '1 Timothy': ['1ti', '1 tim'],
  '2 Timothy': ['2ti', '2 tim'],
  Titus: ['titus'],
  Philemon: ['phlm', 'philem'],
  Hebrews: ['heb'],
  James: ['jas', 'james'],
  '1 Peter': ['1pe', '1 pet', '1 pt'],
  '2 Peter': ['2pe', '2 pet', '2 pt'],
  '1 John': ['1jn', '1 jn'],
  '2 John': ['2jn', '2 jn'],
  '3 John': ['3jn', '3 jn'],
  Jude: ['jude'],
  Revelation: ['rev', 'revelations', 'apocalypse'],
};

const ORDINAL_PREFIXES: Record<string, string> = {
  first: '1',
  second: '2',
  third: '3',
  one: '1',
  two: '2',
  three: '3',
  i: '1',
  ii: '2',
  iii: '3',
};

function expandNumberedBookAliases(book: string): string[] {
  const match = book.match(/^(\d)\s+(.+)$/);
  if (!match) {
    return [book.toLowerCase()];
  }

  const [, num, rest] = match;
  const ordinals = Object.entries(ORDINAL_PREFIXES)
    .filter(([, digit]) => digit === num)
    .map(([word]) => `${word} ${rest.toLowerCase()}`);

  return [
    book.toLowerCase(),
    `${num}${rest.toLowerCase()}`,
    ...ordinals,
  ];
}

/** All lowercase aliases mapped to canonical book names. */
export function buildBookAliasLookup(enabledBooks: string[]): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const book of enabledBooks) {
    const aliases = new Set<string>([
      ...expandNumberedBookAliases(book),
      ...(BOOK_ABBREVIATIONS[book] ?? []),
    ]);

    for (const alias of aliases) {
      lookup.set(alias.replace(/\s+/g, ' ').trim(), book);
    }
  }

  return lookup;
}

/** Contextual strings to bias the speech recognizer toward Bible book names. */
export function buildSpeechContextStrings(enabledBooks: string[]): string[] {
  const strings = new Set<string>();

  for (const book of enabledBooks) {
    strings.add(book);
    for (const alias of BOOK_ABBREVIATIONS[book] ?? []) {
      strings.add(alias);
    }
    const numbered = expandNumberedBookAliases(book);
    for (const alias of numbered) {
      strings.add(alias);
    }
  }

  strings.add('chapter');
  strings.add('four');
  strings.add('Acts four');
  strings.add('Acts 4');

  return [...strings];
}

/**
 * Extracts chapter summaries from asv.ts and generates data/chapter-summaries.ts
 * Run with: node scripts/extract-summaries.cjs
 */
const fs = require('fs');
const path = require('path');

const asvPath = path.join(__dirname, '..', 'data', 'asv.ts');
const outPath = path.join(__dirname, '..', 'data', 'chapter-summaries.ts');

const content = fs.readFileSync(asvPath, 'utf-8');

const allBookMatches = [...content.matchAll(/"Book":\s*"([^"]+)"/g)];
const summaryMatches = [...content.matchAll(/"Summary":\s*"((?:[^"\\]|\\.)*)"/g)];

// Filter to only top-level book entries: followed by "Enabled" or "Chapters" within 100 chars.
// duplicateLocation "Book" entries are followed by "Chapter" (singular).
const bookMatches = allBookMatches.filter(m => {
  const window = content.slice(m.index + m[0].length, m.index + m[0].length + 100);
  return /"Enabled"\s*:|"Chapters"\s*:/.test(window);
});

// Real chapter entries use "Chapter": N immediately followed by "Verses":.
// duplicateLocations use "Chapter": N then "Verse": (singular) — must not match.
const chapterMatches = [...content.matchAll(/"Chapter":\s*(\d+),\s*\n\s*"Verses":/g)];

console.log(`Found ${allBookMatches.length} total "Book" occurrences, ${bookMatches.length} are book-level`);
console.log(`Found ${chapterMatches.length} chapter-level entries`);
console.log(`Found ${summaryMatches.length} summaries`);

const bookPositions = bookMatches.map(m => ({ index: m.index, book: m[1] }));
const chapterPositions = chapterMatches.map(m => ({
  index: m.index,
  chapter: parseInt(m[1], 10),
}));
const summaryPositions = summaryMatches.map(m => ({ index: m.index, summary: m[1] }));

function decodeSummaryEscapes(summary) {
  return summary.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

const result = {};

for (const sumEntry of summaryPositions) {
  const book = bookPositions.filter(b => b.index < sumEntry.index).at(-1)?.book;
  if (!book) continue;

  const chapter = chapterPositions.filter(c => c.index < sumEntry.index).at(-1)?.chapter;
  if (!chapter) continue;

  if (!result[book]) result[book] = {};
  result[book][chapter] = decodeSummaryEscapes(sumEntry.summary);
}

let output = `// Auto-generated from asv.ts. Do not edit manually.
// Run scripts/extract-summaries.cjs to regenerate.
// Chapter summaries shared across all Bible translations.
export type ChapterSummaries = Record<string, Record<number, string>>;

export const CHAPTER_SUMMARIES: ChapterSummaries = `;

output += JSON.stringify(result, null, 2);
output += ';\n';

fs.writeFileSync(outPath, output, 'utf-8');

const bookCount = Object.keys(result).length;
const totalChapters = Object.values(result).reduce((sum, chs) => sum + Object.keys(chs).length, 0);
console.log(`\nWrote ${bookCount} books, ${totalChapters} chapter summaries to data/chapter-summaries.ts`);

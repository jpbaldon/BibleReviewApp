/**
 * Extracts chapter summaries from asv.ts and generates data/chapter-summaries.ts
 * Run with: node scripts/extract-summaries.cjs
 */
const fs = require('fs');
const path = require('path');

const asvPath = path.join(__dirname, '..', 'data', 'asv.ts');
const outPath = path.join(__dirname, '..', 'data', 'chapter-summaries.ts');

const content = fs.readFileSync(asvPath, 'utf-8');

// Extract book names and their positions
const allBookMatches = [...content.matchAll(/"Book":\s*"([^"]+)"/g)];
const allChapterMatches = [...content.matchAll(/"Chapter":\s*(\d+)/g)];
const summaryMatches = [...content.matchAll(/"Summary":\s*"([^"]+)"/g)];

// Filter to only top-level book entries: followed by "Enabled" or "Chapters" within 100 chars.
// duplicateLocation "Book" entries are followed by "Chapter" (singular).
const bookMatches = allBookMatches.filter(m => {
  const window = content.slice(m.index + m[0].length, m.index + m[0].length + 100);
  return /\"Enabled\"\s*:|\"Chapters\"\s*:/.test(window);
});

// Filter to only chapter-LEVEL "Chapter" keys. Inside duplicateLocations the key
// is always followed shortly by "Verse": (singular number). Real chapters are
// followed by "Verses": (plural array). We check the 200 chars after each match.
const chapterMatches = allChapterMatches.filter(m => {
  const window = content.slice(m.index + m[0].length, m.index + m[0].length + 200);
  return /\"Verses\"\s*:/.test(window);
});

console.log(`Found ${allBookMatches.length} total "Book" occurrences, ${bookMatches.length} are book-level`);
console.log(`Found ${allChapterMatches.length} total "Chapter" occurrences, ${chapterMatches.length} are chapter-level`);
console.log(`Found ${summaryMatches.length} summaries`);

const bookPositions = bookMatches.map(m => ({ index: m.index, book: m[1] }));
const chapterPositions = chapterMatches.map(m => ({ index: m.index, chapter: parseInt(m[1], 10) }));
const summaryPositions = summaryMatches.map(m => ({ index: m.index, summary: m[1] }));

// For each summary, find current book and chapter
const result = {};

for (const sumEntry of summaryPositions) {
  // Find latest book before this summary
  const book = bookPositions.filter(b => b.index < sumEntry.index).at(-1)?.book;
  if (!book) continue;

  // Find latest chapter marker before this summary
  const chapter = chapterPositions.filter(c => c.index < sumEntry.index).at(-1)?.chapter;
  if (!chapter) continue;

  if (!result[book]) result[book] = {};
  result[book][chapter] = sumEntry.summary;
}

// Generate output
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

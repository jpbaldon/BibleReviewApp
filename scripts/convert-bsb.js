#!/usr/bin/env node
/**
 * Converts bsb.txt (tab-separated "Book Chapter:Verse\tText") into
 * bsb.ts matching the structure of asv.ts.
 *
 * Run from the project root:
 *   node scripts/convert-bsb.js
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, '../data/bsb.txt');
const outputPath = path.resolve(__dirname, '../data/bsb.ts');

const raw = fs.readFileSync(inputPath, 'utf8');
const lines = raw.split('\n');

// { [bookName]: { [chapterNum]: { [verseNum]: text } } }
const bible = {};
const bookOrder = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  // Lines that don't start with a known reference pattern are header/footer
  // A valid verse line looks like: "Genesis 1:1\tText..."
  const tabIdx = trimmed.indexOf('\t');
  if (tabIdx === -1) continue;

  const ref = trimmed.slice(0, tabIdx).trim();
  const text = trimmed.slice(tabIdx + 1).trim();

  // Match "Book Chapter:Verse" — book name may contain spaces (e.g. "1 Kings")
  const refMatch = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!refMatch) continue;

  const bookName = refMatch[1];
  const chapterNum = parseInt(refMatch[2], 10);
  const verseNum = parseInt(refMatch[3], 10);

  if (!bible[bookName]) {
    bible[bookName] = {};
    bookOrder.push(bookName);
  }
  if (!bible[bookName][chapterNum]) {
    bible[bookName][chapterNum] = {};
  }
  bible[bookName][chapterNum][verseNum] = text;
}

// Build the output structure
const bibleArray = bookOrder.map(bookName => {
  const chapNums = Object.keys(bible[bookName])
    .map(Number)
    .sort((a, b) => a - b);

  const chapters = chapNums.map(chapNum => {
    const verseNums = Object.keys(bible[bookName][chapNum])
      .map(Number)
      .sort((a, b) => a - b);

    const verses = verseNums.map(verseNum => ({
      VerseNumber: verseNum,
      Text: bible[bookName][chapNum][verseNum],
    }));

    return { Chapter: chapNum, Verses: verses };
  });

  return { Book: bookName, Enabled: true, Chapters: chapters };
});

// Serialise to match asv.ts style (tabs for indentation)
function indent(n) {
  return '\t'.repeat(n);
}

function serializeVerse(v, depth) {
  return (
    `${indent(depth)}{\n` +
    `${indent(depth + 1)}"VerseNumber": ${v.VerseNumber},\n` +
    `${indent(depth + 1)}"Text": ${JSON.stringify(v.Text)}\n` +
    `${indent(depth)}}`
  );
}

function serializeChapter(ch, depth) {
  const versesStr = ch.Verses.map(v => serializeVerse(v, depth + 2)).join(',\n');
  return (
    `${indent(depth)}{\n` +
    `${indent(depth + 1)}"Chapter": ${ch.Chapter},\n` +
    `${indent(depth + 1)}"Verses": [\n` +
    versesStr + '\n' +
    `${indent(depth + 1)}]\n` +
    `${indent(depth)}}`
  );
}

function serializeBook(book, depth) {
  const chaptersStr = book.Chapters.map(ch => serializeChapter(ch, depth + 2)).join(',\n');
  return (
    `${indent(depth)}{\n` +
    `${indent(depth + 1)}"Book": ${JSON.stringify(book.Book)},\n` +
    `${indent(depth + 1)}"Enabled": true,\n` +
    `${indent(depth + 1)}"Chapters": [\n` +
    chaptersStr + '\n' +
    `${indent(depth + 1)}]\n` +
    `${indent(depth)}}`
  );
}

const booksStr = bibleArray.map(b => serializeBook(b, 1)).join(',\n');

const output =
  `export const BSB = {\n` +
  `\t"Bible": [\n` +
  booksStr + '\n' +
  `\t]\n` +
  `};\n`;

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Done. Wrote ${bibleArray.length} books to ${outputPath}`);

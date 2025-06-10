import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { ReviewScreenTemplate } from '../../components/ReviewScreenTemplate';
import { useBibleBooks, Chapter } from '../../context/BibleBooksContext';
import type { Rarity } from '../../context/BibleBooksContext';

export default function Verses() {
    const { bibleBooks } = useBibleBooks();
  
    const enabledBooks = bibleBooks.filter(b => b.Enabled && b.Chapters && b.Chapters.length > 0);

    const rarityWeightMap: Record<Rarity, number> = {
      common: 1.0,
      uncommon: 0.5,
      rare: 0.2,
      disabled: 0.0,
    }
  
    // If no enabled books with chapters, show loading or info
    if (enabledBooks.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
          <ActivityIndicator size="large" color="#00e676" />
          <Text style={{ marginTop: 10, color: '#ccc' }}>Waiting for books to be enabled...</Text>
        </View>
      );
    }
  const getRandomVerse = async () => {
    const weightedChapters: {
      book: string;
      chapterIndex: number;
      chapter: Chapter;
      weight: number;
    }[] = [];

    for (const book of enabledBooks) {
      if (!book.Chapters) continue;

      for (const chapter of book.Chapters) {
        const rarity = chapter.rarity ?? 'common';
        const rarityWeight = rarityWeightMap[rarity];

        if(rarityWeight > 0) {
          weightedChapters.push({
            book: book.Book,
            chapterIndex: chapter.Chapter,
            chapter,
            weight: rarityWeight
          });
        }
      }
    }

    if (weightedChapters.length === 0) {
      throw new Error('No eligible chapters with non-zero weight.');
    }

    const totalWeight = weightedChapters.reduce((sum, ch) => sum + ch.weight, 0);
    const rand = Math.random() * totalWeight;

    let runningWeight = 0;
    let selected = weightedChapters[0];

    for (const entry of weightedChapters) {
      runningWeight += entry.weight;
      if (rand <= runningWeight) {
        selected = entry;
        break;
      }
    }

    const { book, chapter, chapterIndex } = selected;
    const verse = chapter.Verses[Math.floor(Math.random() * chapter.Verses.length)];

    return {
      book,
      chapter: chapterIndex,
      verseNumber: verse.VerseNumber,
      text: verse.Text,
      context: chapter.Verses,
    };
  };

  const checkCorrectness = (book: string, chapter: string, item: any) =>
    book === item.book && parseInt(chapter, 10) === item.chapter;

  const renderQuestion = (item: any, showAnswer: boolean) => {
    if (showAnswer) {
      return (
        <View>
          <Text style={{ fontWeight: 'bold', fontSize: 22, color: 'white' }}>{item.book} {item.chapter}</Text>
          {item.context.map((v: any) => (
            <Text
              key={v.VerseNumber}
              style={{ color: v.VerseNumber === item.verseNumber ? 'yellow' : 'white' }}
            >
              <Text style={{ fontWeight: 'bold' }}>{v.VerseNumber} </Text>
              {v.Text}
            </Text>
          ))}
        </View>
      );
    }

    return (
      <Text style={{ fontSize: 18, fontStyle: 'italic', color: 'white' }}>{item.text}</Text>
    );
  };

  return (
    <ReviewScreenTemplate
      title="Verse Review"
      points={5}
      getRandomItem={getRandomVerse}
      checkCorrectness={checkCorrectness}
      renderQuestion={renderQuestion}
    />
  );
}
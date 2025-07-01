import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { ReviewScreenTemplate } from '../../components/ReviewScreenTemplate';
import { useBibleBooks } from '../../context/BibleBooksContext';
import { getWeightedChapters, selectWeightedChapter } from '@/utils/randomChapter';
import { useThemeContext } from '../../context/ThemeContext';
import { DuplicateLocation } from '../../types';

export default function Verses() {
    const { bibleBooks } = useBibleBooks();
  
    const enabledBooks = bibleBooks.filter(b => b.enabled && b.chapters && b.chapters.length > 0);
    const { theme } = useThemeContext();
  
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
    const weightedChapters = getWeightedChapters(enabledBooks);

    if(weightedChapters.length === 0) throw new Error('No eligible chapters.');

    const { book, chapter, chapterIndex } = selectWeightedChapter(weightedChapters);
    const verse = chapter.verses[Math.floor(Math.random() * chapter.verses.length)];

    return {
      book,
      chapter: chapterIndex,
      verseNumber: verse.verseNumber,
      text: verse.text,
      duplicateLocations: verse.duplicateLocations,
      context: chapter.verses,
    };
  };

  const checkCorrectness = (book: string, chapter: string, item: any) => {
    const inputBook = book.trim();
    const inputChapter = parseInt(chapter, 10);

    console.log(item);

    if(inputBook === item.book && inputChapter === item.chapter)
      return true;

    if(item.duplicateLocations && Array.isArray(item.duplicateLocations)) {
      return item.duplicateLocations.some((loc: DuplicateLocation) => 
        loc.Book === inputBook && loc.Chapter === inputChapter
      );
    }

    return false;
  }

  const renderQuestion = (item: any, showAnswer: boolean) => {
    if (showAnswer) {
      return (
        <View>
          <Text style={{ fontWeight: 'bold', fontSize: 22, color: theme.text }}>{item.book} {item.chapter}</Text>
          {item.context.map((v: any) => (
            <Text
              key={v.verseNumber}
              style={{ color: v.verseNumber === item.verseNumber ? theme.highlightedText : theme.text }}
            >
              <Text style={{ fontWeight: 'bold' }}>{v.verseNumber} </Text>
              {v.text}
            </Text>
          ))}
        </View>
      );
    }

    return (
      <Text style={{ fontSize: 18, fontStyle: 'italic', color: theme.text }}>{item.text}</Text>
    );
  };

  return (
    <ReviewScreenTemplate
      title="Verse Review"
      points={10}
      getRandomItem={getRandomVerse}
      checkCorrectness={checkCorrectness}
      renderQuestion={renderQuestion}
    />
  );
}
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { ReviewScreenTemplate, ReviewItem } from '@/components/ReviewScreenTemplate';
import { useBibleBooks } from '../../context/BibleBooksContext';
import { getWeightedChapters, selectWeightedChapter } from '@/utils/randomChapter';
import { useThemeContext } from '../../context/ThemeContext';

export default function Summaries() {
  const { bibleBooks } = useBibleBooks();
  const { theme } = useThemeContext();

  const enabledBooks = bibleBooks.filter(b => b.enabled && b.chapters && b.chapters.length > 0);

  // If no enabled books with chapters, show loading or info
  if (enabledBooks.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#00e676" />
        <Text style={{ marginTop: 10, color: '#ccc' }}>Waiting for books to be enabled...</Text>
      </View>
    );
  }

  const getRandomSummary = async () => {
    try {
      const weightedChapters = getWeightedChapters(enabledBooks);
      console.log('Weighted chapters count:', weightedChapters.length);

      if (weightedChapters.length === 0) {
        throw new Error('No eligible chapters.');
      }

      const { book, chapter, chapterIndex } = selectWeightedChapter(weightedChapters);

      console.log('Selected chapter:', book, chapterIndex);

      return {
        book,
        chapter: chapterIndex,
        text: chapter.summary ?? "No summary available",
        context: chapter.verses,
        duplicateLocations: [],
        originalBook: book,
        originalChapter: chapterIndex,
      };
    } catch (error) {
      console.error('Error in getRandomSummary:', error);
      return null;  // Return null so loadNewItem can handle it gracefully
    }
  };

  const getRandomItem = async () => {
    const item = await getRandomSummary();
    console.log('getRandomItem returned:', item);
    return item;
  };

  const checkCorrectness = (book: string, chapter: string, item: ReviewItem) =>
    book === item.book && parseInt(chapter, 10) === item.chapter;

  const renderQuestion = (item: ReviewItem, showAnswer: boolean) => {
    const isOriginalChapter = item.book === item.originalBook && item.chapter === item.originalChapter;

    return (
      <View>
        {/* Only show summary if still on original chapter */}
        {isOriginalChapter && (
          <Text style={{ fontSize: 18, fontStyle: 'italic', color: showAnswer ? theme.highlightedText : theme.text, marginBottom: 5 }}>
            {item.text}
          </Text>
        )}
        {showAnswer && (
          <>
            <Text style={{ fontWeight: 'bold', fontSize: 22, color: theme.text }}>
              {item.book} {item.chapter}
            </Text>
            {item.context.map((v) => (
              <Text key={v.verseNumber} style={{ color: theme.text }}>
                <Text style={{ fontWeight: 'bold' }}>{v.verseNumber} </Text>
                {v.text}
              </Text>
            ))}
          </>
        )}
      </View>
    );
  };

  return (
    <ReviewScreenTemplate
      title="Chapter Summary Review"
      points={5}
      getRandomItem={getRandomItem}
      checkCorrectness={checkCorrectness}
      renderQuestion={(item, showAnswer) =>
        renderQuestion(item, showAnswer)
      }
    />
  );
}
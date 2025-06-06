import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { ReviewScreenTemplate, ReviewItem } from '@/components/ReviewScreenTemplate';
import { useBibleBooks } from '../../context/BibleBooksContext';

export default function Summaries() {
  const { bibleBooks } = useBibleBooks();

  const enabledBooks = bibleBooks.filter(b => b.Enabled && b.Chapters && b.Chapters.length > 0);

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
    const randomBook = enabledBooks[Math.floor(Math.random() * enabledBooks.length)];
    const chapters = randomBook.Chapters;

    if (!chapters || chapters.length === 0) {
      throw new Error(`No chapters in selected book: ${randomBook.Book}`);
    }

    const chapter = chapters[Math.floor(Math.random() * chapters.length)];

    return {
      book: randomBook.Book,
      chapter: chapter.Chapter,
      text: chapter.Summary ?? "No summary available",
      context: chapter.Verses,
    };
  };

  const checkCorrectness = (book: string, chapter: string, item: ReviewItem) =>
    book === item.book && parseInt(chapter, 10) === item.chapter;

  const renderQuestion = (item: ReviewItem, showAnswer: boolean) => {
    return (
      <View>
        <Text style={{ fontSize: 18, fontStyle: 'italic', color: showAnswer ? 'yellow' : 'white', marginBottom: 5 }}>
          {item.text}
        </Text>
        {showAnswer && (
          <>
            <Text style={{ fontWeight: 'bold', fontSize: 22, color: 'white' }}>
              {item.book} {item.chapter}
            </Text>
            {item.context.map((v) => (
              <Text key={v.VerseNumber} style={{ color: 'white' }}>
                <Text style={{ fontWeight: 'bold' }}>{v.VerseNumber} </Text>
                {v.Text}
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
      getRandomItem={getRandomSummary}
      checkCorrectness={checkCorrectness}
      renderQuestion={renderQuestion}
    />
  );
}
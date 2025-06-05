import React from 'react';
import { View, Text } from 'react-native';
import { ASV } from '@/data/asv';
import { ReviewScreenTemplate, ReviewItem } from '@/components/ReviewScreenTemplate';

export default function TabThreeScreen() {
  const getRandomSummary = async () => {
    const enabledBooks = ASV.Bible.filter((b) => b.Enabled);
    const randomBook = enabledBooks[Math.floor(Math.random() * enabledBooks.length)];
    const chapter = randomBook.Chapters[Math.floor(Math.random() * randomBook.Chapters.length)];

    return {
      book: randomBook.Book,
      chapter: chapter.Chapter,
      text: chapter.Summary ?? "No summary available",
      context: chapter.Verses,
    };
  };

  const checkCorrectness = (book: string, chapter: string, item: ReviewItem) =>
    book === item.book && parseInt(chapter, 10) === item.chapter;

  const renderQuestion = (item: any, showAnswer: boolean) => {
    if (showAnswer) {
      return (
        <View>
          <Text style={{ fontSize: 18, fontStyle: 'italic', color: 'yellow', marginBottom: 5 }}>{item.text}</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 22, color: 'white' }}>{item.book} {item.chapter}</Text>
          {item.context.map((v: any) => (
            <Text key={v.VerseNumber} style={{ color: 'white' }}>
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
      title="Chapter Summary Review"
      points={5}
      getRandomItem={getRandomSummary}
      checkCorrectness={checkCorrectness}
      renderQuestion={renderQuestion}
    />
  );
}
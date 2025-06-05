import React from 'react';
import { View, Text } from 'react-native';
import { ASV } from '@/data/asv';
import { ReviewScreenTemplate } from '../../components/ReviewScreenTemplate';

export default function TabTwoScreen() {
  const getRandomVerse = async () => {
    const enabledBooks = ASV.Bible.filter((b) => b.Enabled);
    const randomBook = enabledBooks[Math.floor(Math.random() * enabledBooks.length)];
    const chapter = randomBook.Chapters[Math.floor(Math.random() * randomBook.Chapters.length)];
    const verse = chapter.Verses[Math.floor(Math.random() * chapter.Verses.length)];

    return {
      book: randomBook.Book,
      chapter: chapter.Chapter,
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
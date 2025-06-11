import React, {useState} from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { ReviewScreenTemplate, ReviewItem } from '@/components/ReviewScreenTemplate';
import { useBibleBooks } from '../../context/BibleBooksContext';
import { getWeightedChapters, selectWeightedChapter } from '@/utils/randomChapter';

export default function Summaries() {
  const { bibleBooks } = useBibleBooks();

  const enabledBooks = bibleBooks.filter(b => b.Enabled && b.Chapters && b.Chapters.length > 0);

  const [originalBook, setOriginalBook] = useState<string | null>(null);
  const [originalChapter, setOriginalChapter] = useState<number | null>(null);

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
    const weightedChapters = getWeightedChapters(enabledBooks);

    if(weightedChapters.length === 0) throw new Error('No eligible chapters.');

    const { book, chapter, chapterIndex } = selectWeightedChapter(weightedChapters);

    return {
      book,
      chapter: chapterIndex,
      text: chapter.Summary ?? "No summary available",
      context: chapter.Verses,
    };
  };

  // Update original chapter and book when item is fetched
  const getRandomItem = async () => {
    const item = await getRandomSummary();
    setOriginalBook(item.book);
    setOriginalChapter(item.chapter);
    return item;
  };

  const checkCorrectness = (book: string, chapter: string, item: ReviewItem) =>
    book === item.book && parseInt(chapter, 10) === item.chapter;

  const renderQuestion = (item: ReviewItem, showAnswer: boolean, originalBook: string, originalChapter: number) => {

    if (!originalBook || originalChapter === null) {
      return <Text style={{ color: 'white' }}>Loading Question...</Text>;
    }

    const isOriginalChapter = item.book === originalBook && item.chapter === originalChapter;

    return (
      <View>
        {/* Only show the summary if the chapter has not navigated away from the original chapter */}
        {isOriginalChapter && (
          <Text style={{ fontSize: 18, fontStyle: 'italic', color: showAnswer ? 'yellow' : 'white', marginBottom: 5 }}>
            {item.text}
          </Text>
        )}
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
      getRandomItem={getRandomItem}
      checkCorrectness={checkCorrectness}
      renderQuestion={(item, showAnswer) => 
        renderQuestion(item, showAnswer, originalBook ?? '', originalChapter ?? 0)
      }
    />
  );
}
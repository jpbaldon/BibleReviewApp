import { BibleBook, Chapter } from '../types'
import { useTimer } from '../context/TimerContext';
import { useBibleBooks } from '../context/BibleBooksContext';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'ultraRare' | 'disabled';

export const rarityWeightMap: Record<Rarity, number> = {
    common: 1.0,
    uncommon: 0.5,
    rare: 0.2,
    'ultraRare': 0.1,
    disabled: 0.0,
} as const;

interface WeightedChapter {
    book: string;
    chapterIndex: number;
    chapter: Chapter;
    weight: number;
}

export function useWeightedChapters(enabledBooks: BibleBook[]): WeightedChapter[] {

    const { competitiveTimer } = useTimer();
    const { bibleBooks } = useBibleBooks();

    const inCompetitiveSession = competitiveTimer && competitiveTimer.isActive;

    const allowedBooks = inCompetitiveSession ? bibleBooks : enabledBooks; // Use all books in competitive session

    const weightedChapters: WeightedChapter[] = [];

    for (const book of allowedBooks) {
        if(!book.chapters) continue;

        for (const chapter of book.chapters) {
            const rarity = !inCompetitiveSession && chapter.rarity ? chapter.rarity : 'common';  // use all chapters in competitive session
            const weight = rarityWeightMap[rarity];

            if(weight > 0) {
                weightedChapters.push({
                    book: book.bookName,
                    chapterIndex: chapter.chapter,
                    chapter,
                    weight,
                });
            }
        }
    }

    return weightedChapters;
}

export function selectWeightedChapter(chapters: WeightedChapter[]): WeightedChapter {
    const totalWeight = chapters.reduce((sum, ch) => sum + ch.weight, 0);
    const rand = Math.random() * totalWeight;

    let runningWeight = 0;

    for (const ch of chapters) {
        runningWeight += ch.weight;
        if (rand <= runningWeight) {
            return ch;
        }
    }

    return chapters[0];
}

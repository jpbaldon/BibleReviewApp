import { Chapter, BibleBook } from '@/context/BibleBooksContext';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'disabled';

export const rarityWeightMap: Record<Rarity, number> = {
    common: 1.0,
    uncommon: 0.5,
    rare: 0.2,
    disabled: 0.0,
};

interface WeightedChapter {
    book: string;
    chapterIndex: number;
    chapter: Chapter;
    weight: number;
}

export function getWeightedChapters(enabledBooks: BibleBook[]): WeightedChapter[] {
    const weightedChapters: WeightedChapter[] = [];

    for (const book of enabledBooks) {
        if(!book.Chapters) continue;

        for (const chapter of book.Chapters) {
            const rarity = chapter.rarity ?? 'common';
            const weight = rarityWeightMap[rarity];

            if(weight > 0) {
                weightedChapters.push({
                    book: book.Book,
                    chapterIndex: chapter.Chapter,
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

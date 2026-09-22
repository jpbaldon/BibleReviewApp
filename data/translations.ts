import type { DuplicateLocation } from '../types';
import { ASV } from './asv';
import { BSB } from './bsb';

export type TranslationKey = 'ASV' | 'BSB';

type TranslationBible = {
  Bible: {
    Book: string;
    Enabled: boolean;
    Chapters: {
      Chapter: number;
      Summary?: string;
      Verses: {
        VerseNumber: number;
        Text: string;
        duplicateLocations?: DuplicateLocation[];
      }[];
    }[];
  }[];
};

export const TRANSLATIONS: Record<TranslationKey, TranslationBible> = {
  ASV,
  BSB,
};

export { ASV, BSB };

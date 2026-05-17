import { ASV } from './asv';
import { BSB } from './bsb';

export type TranslationKey = 'ASV' | 'BSB';

export const TRANSLATIONS: Record<TranslationKey, typeof ASV> = {
  ASV,
  BSB,
};

export { ASV, BSB };

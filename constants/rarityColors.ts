import type { Rarity } from '../types';

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#4CAF50',
  uncommon: '#2196F3',
  rare: '#9C27B0',
  ultraRare: '#FF9800',
  disabled: '#9E9E9E',
};

export const RARITY_ON_COLOR = '#FAFAF9';

export function rarityLabel(rarity: Rarity): string {
  if (rarity === 'ultraRare') return 'Ultra-Rare';
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

export function rarityAccessibilityName(rarity: Rarity): string {
  return rarity === 'ultraRare' ? 'ultra-rare' : rarity;
}

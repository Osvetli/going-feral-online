import type { Rarity } from '../types';

const RARITY_WEIGHTS: Record<Rarity, number> = {
  SSR: 3,
  SR: 12,
  R: 25,
  N: 60,
};

export function randomRarity(): Rarity {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;

  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    random -= weight;
    if (random <= 0) return rarity as Rarity;
  }

  return 'N';
}

export function getRarityColor(rarity: Rarity): string {
  switch (rarity) {
    case 'SSR': return '#ffd700';
    case 'SR': return '#c0a0ff';
    case 'R': return '#60a0ff';
    case 'N': return '#909090';
  }
}

export function getRarityLabel(rarity: Rarity): string {
  return rarity;
}

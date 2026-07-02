import { prisma } from '../index';

export interface GachaResult {
  card: {
    id: string;
    name: string;
    rarity: string;
    mode: string;
    description: string;
    emoji: string;
  };
  isNew: boolean;
}

const RARITY_WEIGHTS: Record<string, number> = {
  SSR: 3,
  SR: 12,
  R: 25,
  N: 60,
};

function weightedRandomRarity(): string {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;

  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    random -= weight;
    if (random <= 0) return rarity;
  }

  return 'N'; // fallback
}

export async function drawCard(
  userId: string,
  mode: string
): Promise<GachaResult | null> {
  // Determine rarity
  const rarity = weightedRandomRarity();

  // Find cards matching rarity and mode
  const cards = await prisma.card.findMany({
    where: { rarity, mode },
  });

  if (cards.length === 0) {
    // Fallback: find any card matching mode
    const anyCards = await prisma.card.findMany({ where: { mode } });
    if (anyCards.length === 0) return null;

    const card = anyCards[Math.floor(Math.random() * anyCards.length)];

    // Check if user already has this card
    const existing = await prisma.userCard.findFirst({
      where: { userId, cardId: card.id },
    });

    return { card, isNew: !existing };
  }

  const card = cards[Math.floor(Math.random() * cards.length)];

  // Check if user already has this card
  const existing = await prisma.userCard.findFirst({
    where: { userId, cardId: card.id },
  });

  return { card, isNew: !existing };
}

export async function saveUserCard(
  userId: string,
  cardId: string,
  runId?: string
) {
  return prisma.userCard.create({
    data: {
      userId,
      cardId,
      runId: runId || null,
    },
    include: { card: true },
  });
}

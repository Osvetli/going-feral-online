import { Router, Request, Response } from 'express';
import { prisma } from '../app';

const router = Router();

// GET /api/collection/:userId — Get user's card collection
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const userCards = await prisma.userCard.findMany({
      where: { userId },
      include: { card: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(userCards);
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/collection/:userId/stats — Collection statistics
router.get('/:userId/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get all cards the user has
    const userCards = await prisma.userCard.findMany({
      where: { userId },
      include: { card: true },
    });

    // Unique card IDs collected
    const uniqueCardIds = new Set(userCards.map((uc) => uc.cardId));

    // Get total cards in each mode
    const totalWorkplace = await prisma.card.count({ where: { mode: 'workplace' } });
    const totalAcademic = await prisma.card.count({ where: { mode: 'academic' } });

    // Count unique per mode
    const wpCards = await prisma.card.findMany({
      where: { mode: 'workplace' },
      select: { id: true },
    });
    const acCards = await prisma.card.findMany({
      where: { mode: 'academic' },
      select: { id: true },
    });

    const wpCollected = wpCards.filter((c) => uniqueCardIds.has(c.id)).length;
    const acCollected = acCards.filter((c) => uniqueCardIds.has(c.id)).length;

    // Group by rarity
    const byRarity: Record<string, number> = { SSR: 0, SR: 0, R: 0, N: 0 };
    for (const uc of userCards) {
      if (byRarity[uc.card.rarity] !== undefined) {
        byRarity[uc.card.rarity]++;
      }
    }

    res.json({
      totalUnique: uniqueCardIds.size,
      totalCards: userCards.length,
      workplace: { collected: wpCollected, total: totalWorkplace, complete: wpCollected === totalWorkplace },
      academic: { collected: acCollected, total: totalAcademic, complete: acCollected === totalAcademic },
      byRarity,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

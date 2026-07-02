import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { drawCard, saveUserCard } from '../utils/gachaLogic';

const router = Router();

// POST /api/gacha/draw — Draw a card
router.post('/draw', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const { mode, runId } = req.body;

    if (!mode || !['workplace', 'academic'].includes(mode)) {
      res.status(400).json({ error: 'mode must be "workplace" or "academic"' });
      return;
    }

    // Draw a card
    const result = await drawCard(userId, mode);
    if (!result) {
      res.status(500).json({ error: 'No cards available for this mode' });
      return;
    }

    // Save to user's collection
    const userCard = await saveUserCard(userId, result.card.id, runId || undefined);

    // Update run's resultCard if runId provided
    if (runId) {
      await prisma.run.update({
        where: { id: runId },
        data: { resultCard: result.card.id },
      });
    }

    res.json({
      card: result.card,
      isNew: result.isNew,
      userCardId: userCard.id,
    });
  } catch (error) {
    console.error('Gacha draw error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

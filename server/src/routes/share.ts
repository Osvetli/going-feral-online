import { Router, Request, Response } from 'express';
import { prisma } from '../app';

const router = Router();

// POST /api/share — Create a share link
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const { runId } = req.body;
    if (!runId) {
      res.status(400).json({ error: 'runId is required' });
      return;
    }

    // Verify the run belongs to the user
    const run = await prisma.run.findFirst({
      where: { id: runId, userId },
    });

    if (!run) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }

    const share = await prisma.share.create({
      data: { userId, runId },
    });

    res.json({ id: share.id, createdAt: share.createdAt });
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/share/:id — View a share
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const share = await prisma.share.findUnique({ where: { id } });
    if (!share) {
      res.status(404).json({ error: 'Share not found' });
      return;
    }

    const run = await prisma.run.findUnique({ where: { id: share.runId } });
    const user = await prisma.user.findUnique({ where: { id: share.userId } });

    // If the run has a result card, include card info
    let card = null;
    if (run?.resultCard) {
      card = await prisma.card.findUnique({ where: { id: run.resultCard } });
    }

    res.json({
      share: { id: share.id, createdAt: share.createdAt },
      user: user ? { nickname: user.nickname } : null,
      run: run
        ? {
            mode: run.mode,
            inputType: run.inputType,
            content: run.content,
            drawLabel: run.drawLabel,
            createdAt: run.createdAt,
          }
        : null,
      card: card
        ? { name: card.name, rarity: card.rarity, emoji: card.emoji, description: card.description }
        : null,
    });
  } catch (error) {
    console.error('Get share error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

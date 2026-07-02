import { Router, Request, Response } from 'express';
import { prisma } from '../index';

const router = Router();

// POST /api/runs — Save a "madness run"
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const { mode, inputType, content, drawLabel, resultCard } = req.body;

    if (!mode || !inputType || !content) {
      res.status(400).json({ error: 'mode, inputType, and content are required' });
      return;
    }

    if (!['workplace', 'academic'].includes(mode)) {
      res.status(400).json({ error: 'mode must be "workplace" or "academic"' });
      return;
    }

    if (!['text', 'draw'].includes(inputType)) {
      res.status(400).json({ error: 'inputType must be "text" or "draw"' });
      return;
    }

    const run = await prisma.run.create({
      data: {
        userId,
        mode,
        inputType,
        content,
        drawLabel: drawLabel || null,
        resultCard: resultCard || null,
      },
    });

    res.json(run);
  } catch (error) {
    console.error('Create run error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/runs?userId= — Get user's runs
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    if (!userId) {
      res.status(400).json({ error: 'userId required' });
      return;
    }

    const runs = await prisma.run.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(runs);
  } catch (error) {
    console.error('Get runs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

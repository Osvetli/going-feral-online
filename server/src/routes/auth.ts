import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import bcrypt from 'bcryptjs';

const router = Router();
const SALT_ROUNDS = 10;

// POST /api/auth/register — Register with nickname + password
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { nickname, password } = req.body;

    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      res.status(400).json({ error: 'Nickname is required' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters' });
      return;
    }

    const trimmed = nickname.trim();

    // Check if nickname already taken
    const existing = await prisma.user.findUnique({ where: { nickname: trimmed } });
    if (existing) {
      res.status(409).json({ error: 'This nickname is already taken' });
      return;
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { nickname: trimmed, password: hash },
    });

    res.json({ id: user.id, nickname: user.nickname, createdAt: user.createdAt });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login — Login with nickname + password
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { nickname, password } = req.body;

    if (!nickname || !password) {
      res.status(400).json({ error: 'Nickname and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { nickname: nickname.trim() } });
    if (!user) {
      res.status(401).json({ error: 'Invalid nickname or password' });
      return;
    }

    // For users created before password was added, allow login without password
    if (!user.password) {
      res.json({ id: user.id, nickname: user.nickname, createdAt: user.createdAt });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid nickname or password' });
      return;
    }

    res.json({ id: user.id, nickname: user.nickname, createdAt: user.createdAt });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me — Get user by x-user-id header
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: 'No user ID provided' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ id: user.id, nickname: user.nickname, createdAt: user.createdAt });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auth/unregister — Cascade delete user + all their data
router.delete('/unregister', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      res.status(401).json({ error: 'User ID required' });
      return;
    }

    const { password } = req.body;

    // Verify the user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // If user has a password, require it for deletion
    if (user.password) {
      if (!password || typeof password !== 'string') {
        res.status(400).json({ error: 'Password required to delete account' });
        return;
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        res.status(401).json({ error: 'Invalid password' });
        return;
      }
    }

    // Cascade delete: UserCards → Runs → Shares → User
    await prisma.userCard.deleteMany({ where: { userId } });
    await prisma.run.deleteMany({ where: { userId } });
    await prisma.share.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.json({ success: true, message: 'Account and all data permanently deleted' });
  } catch (error) {
    console.error('Unregister error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

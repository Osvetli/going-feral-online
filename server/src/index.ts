import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import runsRouter from './routes/run';
import gachaRouter from './routes/gacha';
import collectionRouter from './routes/collection';
import shareRouter from './routes/share';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 images

// Routes
app.use('/api/auth', authRouter);
app.use('/api/runs', runsRouter);
app.use('/api/gacha', gachaRouter);
app.use('/api/collection', collectionRouter);
app.use('/api/share', shareRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🔮 赛博发疯功德置换器 — Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

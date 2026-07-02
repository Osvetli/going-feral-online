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

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

export default app;

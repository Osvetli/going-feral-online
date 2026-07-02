import app from './app';
import { prisma } from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🔮 赛博发疯功德置换器 — Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

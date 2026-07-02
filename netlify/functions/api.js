// With esbuild bundler, dependencies are auto-resolved
const serverless = require('serverless-http');
const path = require('path');

// Ensure Prisma finds the schema at runtime
process.env.PRISMA_SCHEMA_PATH = path.resolve(__dirname, '../../server/prisma/schema.prisma');

let cached = null;

async function loadApp() {
  if (cached) return cached;

  const app = require('../../server/dist/app').default;
  const { prisma } = require('../../server/dist/app');

  // Diagnostic route
  app.get('/api/debug', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const userCount = await prisma.user.count();
      const cardCount = await prisma.card.count();
      res.json({ ok: true, db: 'connected', users: userCount, cards: cardCount });
    } catch (e) {
      res.json({ ok: false, db: 'disconnected', error: e.message });
    }
  });

  cached = serverless(app, { binary: ['image/*'] });
  return cached;
}

exports.handler = async (event, context) => {
  try {
    const handler = await loadApp();
    return await handler(event, context);
  } catch (err) {
    console.error('[api] Fatal:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', detail: err.message }),
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    };
  }
};

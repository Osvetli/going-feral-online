const path = require('path');

// Point Prisma to the schema (required before loading app)
process.env.PRISMA_SCHEMA_PATH = path.resolve(__dirname, '../../server/prisma/schema.prisma');

// Load deps from server/node_modules (bundler=none → must use explicit paths)
const serverNM = (name) => path.resolve(__dirname, '../../server/node_modules', name);

// We must use the server's own require context so that app.js finds its deps
const appPath = path.resolve(__dirname, '../../server/dist/app.js');
const app = require(appPath).default;
const serverless = require(serverNM('serverless-http'));

// Diagnostic
app.get('/api/debug', async (_req, res) => {
  try {
    const { prisma } = require(appPath);
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    const cardCount = await prisma.card.count();
    res.json({ ok: true, db: 'connected', users: userCount, cards: cardCount });
  } catch (e) {
    res.json({ ok: false, db: 'disconnected', error: e.message });
  }
});

const handler = serverless(app, { binary: ['image/*'] });

exports.handler = async (event, context) => {
  try {
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

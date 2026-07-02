const serverless = require('serverless-http');
const path = require('path');

// Point Prisma to the correct schema and engine location
process.env.PRISMA_SCHEMA_PATH = path.resolve(__dirname, '../../server/prisma/schema.prisma');

let handler = null;
function getHandler() {
  if (!handler) {
    // Load the compiled Express app from server/dist
    const app = require('../../server/dist/app').default;
    handler = serverless(app, { binary: ['image/*', 'application/octet-stream'] });
  }
  return handler;
}

exports.handler = async (event, context) => {
  try {
    const h = getHandler();
    return await h(event, context);
  } catch (err) {
    console.error('API error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};

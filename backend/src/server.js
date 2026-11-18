// Entry point.
// 1) Loads .env
// 2) Tests the DB connection (but DOES NOT crash if it fails)
// 3) Starts Express
// 4) Handles graceful shutdown

require('dotenv').config();
const app = require('./app');
const { pingDatabase } = require('./config/db');

const PORT = Number(process.env.PORT) || 5000;

(async () => {
  try {
    await pingDatabase();
    console.log('[db] Connection OK');
  } catch (err) {
    // Log a CLEAR message but don't exit — API will return 503 on DB-dependent routes
    console.error('[db] Could NOT connect at startup:', err.code || err.message);
    console.error('[db] The API will still start. Fix DB credentials and restart if needed.');
  }

  const server = app.listen(PORT, () => {
    console.log(`[server] Listening on http://localhost:${PORT}`);
    console.log(`[server] Health:    http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`[server] ${signal} received — closing…`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Don't let stray async errors kill the process unexpectedly.
  process.on('unhandledRejection', (err) => {
    console.error('[unhandledRejection]', err);
  });
  process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err);
    // Keep running; controllers already handle their own errors.
  });
})();
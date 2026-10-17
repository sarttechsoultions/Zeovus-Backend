import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function start(): Promise<void> {
  await connectDatabase();
  const server = app.listen(env.PORT, () => console.info(`Backend listening on http://localhost:${env.PORT}`));
  server.on('error', error => { console.error('Server failed to start:', error); process.exitCode = 1; });
  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    const timer = setTimeout(() => process.exit(1), 10000);
    timer.unref();
    server.close(() => { void mongoose.disconnect().then(() => { clearTimeout(timer); process.exitCode = 0; }).catch(error => { console.error(error); process.exit(1); }); });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
void start().catch(error => { console.error('Startup failed:', error); process.exitCode = 1; });

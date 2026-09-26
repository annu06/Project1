import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config.js';
import { connectDatabase, disconnectDatabase } from './db.js';
import { configureRealtime } from './realtime.js';

const io = new Server({
  cors: { origin: (origin, callback) => callback(null, true), credentials: true },
});
const app = createApp(io);
const httpServer = createServer(app);
io.attach(httpServer);
configureRealtime(io);

async function checkAutoSeed() {
  try {
    const { User } = await import('./models/User.js');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Fresh database detected. Auto-seeding demo accounts...');
      const { seedDemoData } = await import('./seed.js');
      await seedDemoData();
    }
  } catch (err) {
    console.warn('Auto-seed check skipped or encountered error:', err);
  }
}

async function start() {
  httpServer.listen(config.port, () => {
    console.log(`RouteFlow API listening on port ${config.port}`);
  });

  const connected = await connectDatabase();
  if (connected) {
    await checkAutoSeed();
  } else {
    const timer = setInterval(async () => {
      console.log('Retrying MongoDB connection...');
      const ok = await connectDatabase();
      if (ok) {
        clearInterval(timer);
        await checkAutoSeed();
      }
    }, 10000);
  }
}



async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  io.close();
  httpServer.close();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

start().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});

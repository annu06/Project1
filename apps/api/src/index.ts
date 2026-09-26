import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config.js';
import { connectDatabase, disconnectDatabase } from './db.js';
import { configureRealtime } from './realtime.js';

const io = new Server({
  cors: { origin: config.clientUrl, credentials: true },
});
const app = createApp(io);
const httpServer = createServer(app);
io.attach(httpServer);
configureRealtime(io);

async function start() {
  await connectDatabase();
  httpServer.listen(config.port, () => {
    console.log(`RouteFlow API listening on http://localhost:${config.port}`);
  });
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

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'socket.io';
import { config } from './config.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { analyticsRouter } from './routes/analytics.js';
import { authRouter } from './routes/auth.js';
import { ordersRouter } from './routes/orders.js';
import { usersRouter } from './routes/users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDistPath = path.resolve(__dirname, '../../web/dist');

export function createApp(io: Server) {
  const app = express();
  app.set('io', io);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  const allowedOrigins = [
    config.clientUrl,
    'http://localhost:5173',
    'http://localhost:4000',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '100kb' }));
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', service: 'routeflow-api', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/analytics', analyticsRouter);

  // In production / unified deployment, serve compiled frontend if available
  if (fs.existsSync(webDistPath)) {
    app.use(express.static(webDistPath));
    app.get('*', (request, response, next) => {
      if (request.path.startsWith('/api') || request.path.startsWith('/socket.io')) {
        return next();
      }
      response.sendFile(path.join(webDistPath, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}


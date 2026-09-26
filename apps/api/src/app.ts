import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import type { Server } from 'socket.io';
import { config } from './config.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { analyticsRouter } from './routes/analytics.js';
import { authRouter } from './routes/auth.js';
import { ordersRouter } from './routes/orders.js';
import { usersRouter } from './routes/users.js';

export function createApp(io: Server) {
  const app = express();
  app.set('io', io);
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', service: 'routeflow-api', timestamp: new Date().toISOString() });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

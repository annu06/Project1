import jwt from 'jsonwebtoken';
import type { Server, Socket } from 'socket.io';
import { config } from './config.js';
import { Order } from './models/Order.js';
import type { UserRole } from './types.js';

interface SocketData {
  userId: string;
  role: UserRole;
}

interface TokenPayload {
  sub: string;
  role: UserRole;
}

export function configureRealtime(io: Server) {
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
      socket.data.auth = { userId: payload.sub, role: payload.role } satisfies SocketData;
      next();
    } catch {
      next(new Error('Invalid or expired session'));
    }
  });

  io.on('connection', (socket) => {
    const auth = socket.data.auth as SocketData;
    void socket.join([`user:${auth.userId}`, `role:${auth.role}`]);

    socket.on('order:join', async (orderId: string, acknowledge?: (result: { ok: boolean }) => void) => {
      const access = auth.role === 'ADMIN'
        ? { _id: orderId }
        : auth.role === 'AGENT'
          ? { _id: orderId, agent: auth.userId }
          : { _id: orderId, customer: auth.userId };
      const allowed = await Order.exists(access);
      if (allowed) await socket.join(`order:${orderId}`);
      acknowledge?.({ ok: Boolean(allowed) });
    });

    socket.on('order:leave', (orderId: string) => void socket.leave(`order:${orderId}`));
  });
}

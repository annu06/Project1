import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';
import type { AuthRequest, UserRole } from '../types.js';
import { AppError } from '../utils/http.js';

interface TokenPayload {
  sub: string;
  role: UserRole;
}

export const authenticate: RequestHandler = (request, _response, next) => {
  void (async () => {
    const token = request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.slice(7)
      : null;
    if (!token) throw new AppError(401, 'Authentication required');

    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch {
      throw new AppError(401, 'Invalid or expired session');
    }

    const user = await User.findById(payload.sub).select('_id role active');
    if (!user?.active) throw new AppError(401, 'Account is unavailable');
    (request as AuthRequest).auth = { userId: user.id, role: user.role };
  })().then(() => next()).catch(next);
};

export const authorize = (...roles: UserRole[]) => (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const auth = (request as AuthRequest).auth;
  if (!auth || !roles.includes(auth.role)) return next(new AppError(403, 'You do not have access to this action'));
  next();
};

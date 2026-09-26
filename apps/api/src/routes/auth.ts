import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { authenticate } from '../middleware/auth.js';
import { User } from '../models/User.js';
import type { AuthRequest } from '../types.js';
import { AppError, asyncHandler } from '../utils/http.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(6),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2).max(80),
  phone: z.string().min(8).max(20),
});

authRouter.post('/register', asyncHandler(async (request, response) => {
  const input = registerSchema.parse(request.body);
  const existing = await User.exists({ email: input.email });
  if (existing) throw new AppError(409, 'An account with this email already exists');
  const user = await User.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash: await bcrypt.hash(input.password, 12),
    role: 'CUSTOMER',
  });
  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
  response.status(201).json({ token, user: user.toJSON() });
}));

authRouter.post('/login', asyncHandler(async (request, response) => {
  const input = loginSchema.parse(request.body);
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user || !user.active || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, 'Incorrect email or password');
  }
  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
  response.json({ token, user: user.toJSON() });
}));

authRouter.get('/me', authenticate, asyncHandler(async (request, response) => {
  const user = await User.findById((request as AuthRequest).auth!.userId);
  if (!user) throw new AppError(404, 'User not found');
  response.json({ user });
}));

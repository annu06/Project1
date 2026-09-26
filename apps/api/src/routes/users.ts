import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { AppError, asyncHandler } from '../utils/http.js';

export const usersRouter = Router();
usersRouter.use(authenticate, authorize('ADMIN'));

usersRouter.get('/', asyncHandler(async (request, response) => {
  const role = z.enum(['CUSTOMER', 'AGENT', 'ADMIN']).optional().parse(request.query.role);
  const users = await User.find(role ? { role } : {}).sort({ createdAt: -1 });
  response.json({ users });
}));

usersRouter.patch('/:id/active', asyncHandler(async (request, response) => {
  const { active } = z.object({ active: z.boolean() }).parse(request.body);
  const user = await User.findByIdAndUpdate(request.params.id, { active }, { new: true });
  if (!user) throw new AppError(404, 'User not found');
  response.json({ user });
}));

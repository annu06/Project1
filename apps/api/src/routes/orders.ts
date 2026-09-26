import { Router } from 'express';
import type { Server } from 'socket.io';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import type { AuthRequest, OrderStatus } from '../types.js';
import { AppError, asyncHandler } from '../utils/http.js';

export const ordersRouter = Router();
ordersRouter.use(authenticate);

const pointSchema = z.object({
  address: z.string().min(4).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const createOrderSchema = z.object({
  customerId: z.string().optional(),
  pickup: pointSchema,
  dropoff: pointSchema,
  recipientName: z.string().min(2).max(80),
  recipientPhone: z.string().min(8).max(20),
  packageDescription: z.string().min(2).max(160),
  weightKg: z.number().positive().max(1000),
  expectedDeliveryAt: z.coerce.date().refine((date) => date > new Date(), 'Expected delivery must be in the future'),
});

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
  speed: z.number().nonnegative().optional(),
  heading: z.number().min(0).max(360).optional(),
});

const statusOrder: OrderStatus[] = ['PLACED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
const populated = [
  { path: 'customer', select: 'name email phone role' },
  { path: 'agent', select: 'name email phone role' },
  { path: 'statusLogs.updatedBy', select: 'name role' },
];

function orderFilter(auth: NonNullable<AuthRequest['auth']>) {
  if (auth.role === 'CUSTOMER') return { customer: auth.userId };
  if (auth.role === 'AGENT') return { agent: auth.userId };
  return {};
}

function emitOrder(request: AuthRequest, event: string, order: unknown, orderId: string) {
  const io = request.app.get('io') as Server;
  io.to(`order:${orderId}`).emit(event, order);
  io.to('role:ADMIN').emit(event, order);
}

ordersRouter.get('/', asyncHandler(async (request, response) => {
  const auth = (request as AuthRequest).auth!;
  const query = z.object({
    status: z.enum(['PLACED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED']).optional(),
    search: z.string().max(100).optional(),
  }).parse(request.query);
  const filter: Record<string, unknown> = { ...orderFilter(auth) };
  if (query.status) filter.status = query.status;
  if (query.search) filter.$or = [
    { trackingId: { $regex: query.search, $options: 'i' } },
    { recipientName: { $regex: query.search, $options: 'i' } },
    { 'dropoff.address': { $regex: query.search, $options: 'i' } },
  ];
  const orders = await Order.find(filter).populate(populated).sort({ createdAt: -1 });
  response.json({ orders });
}));

ordersRouter.post('/', asyncHandler(async (request, response) => {
  const auth = (request as AuthRequest).auth!;
  if (auth.role === 'AGENT') throw new AppError(403, 'Delivery agents cannot create orders');
  const input = createOrderSchema.parse(request.body);
  const customerId = auth.role === 'ADMIN' ? input.customerId : auth.userId;
  if (!customerId || !(await User.exists({ _id: customerId, role: 'CUSTOMER', active: true }))) {
    throw new AppError(400, 'A valid active customer is required');
  }
  const now = new Date();
  const trackingId = `RF${now.toISOString().slice(2, 10).replaceAll('-', '')}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const order = await Order.create({
    ...input,
    customer: customerId,
    trackingId,
    status: 'PLACED',
    statusLogs: [{ status: 'PLACED', note: 'Order placed', updatedBy: auth.userId, createdAt: now }],
  });
  await order.populate(populated);
  emitOrder(request as AuthRequest, 'order:created', order, order.id);
  response.status(201).json({ order });
}));

ordersRouter.get('/:id', asyncHandler(async (request, response) => {
  const auth = (request as AuthRequest).auth!;
  const order = await Order.findOne({ _id: request.params.id, ...orderFilter(auth) }).populate(populated);
  if (!order) throw new AppError(404, 'Order not found');
  response.json({ order });
}));

ordersRouter.post('/:id/assign', authorize('ADMIN'), asyncHandler(async (request, response) => {
  const { agentId } = z.object({ agentId: z.string().min(1) }).parse(request.body);
  const agent = await User.findOne({ _id: agentId, role: 'AGENT', active: true });
  if (!agent) throw new AppError(400, 'Select a valid active delivery agent');
  const order = await Order.findByIdAndUpdate(request.params.id, { agent: agentId }, { new: true }).populate(populated);
  if (!order) throw new AppError(404, 'Order not found');
  emitOrder(request as AuthRequest, 'order:assigned', order, order.id);
  (request.app.get('io') as Server).to(`user:${agentId}`).emit('order:assigned', order);
  response.json({ order });
}));

ordersRouter.patch('/:id/status', authorize('AGENT', 'ADMIN'), asyncHandler(async (request, response) => {
  const auth = (request as AuthRequest).auth!;
  const input = z.object({
    status: z.enum(['PLACED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED']),
    note: z.string().max(200).default(''),
  }).parse(request.body);
  const filter = auth.role === 'AGENT' ? { _id: request.params.id, agent: auth.userId } : { _id: request.params.id };
  const order = await Order.findOne(filter);
  if (!order) throw new AppError(404, 'Assigned order not found');
  if (statusOrder.indexOf(input.status) !== statusOrder.indexOf(order.status) + 1) {
    throw new AppError(400, `Order must advance from ${order.status.replace('_', ' ')} to the next status`);
  }
  order.status = input.status;
  order.statusLogs.push({ status: input.status, note: input.note, updatedBy: auth.userId as never, createdAt: new Date() });
  if (input.status === 'DELIVERED') order.deliveredAt = new Date();
  await order.save();
  await order.populate(populated);
  emitOrder(request as AuthRequest, 'order:status', order, order.id);
  response.json({ order });
}));

ordersRouter.post('/:id/location', authorize('AGENT'), asyncHandler(async (request, response) => {
  const auth = (request as AuthRequest).auth!;
  const input = locationSchema.parse(request.body);
  const recordedAt = new Date();
  const location = { ...input, recordedAt };
  const order = await Order.findOneAndUpdate(
    { _id: request.params.id, agent: auth.userId, status: { $in: ['PICKED_UP', 'IN_TRANSIT'] } },
    { $set: { currentLocation: location }, $push: { locationHistory: { $each: [location], $slice: -500 } } },
    { new: true },
  ).populate(populated);
  if (!order) throw new AppError(404, 'Active assigned order not found');
  emitOrder(request as AuthRequest, 'order:location', { orderId: order.id, location }, order.id);
  response.json({ location });
}));

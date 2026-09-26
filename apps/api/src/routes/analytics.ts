import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/http.js';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate, authorize('ADMIN'));

analyticsRouter.get('/', asyncHandler(async (_request, response) => {
  const now = new Date();
  const [statusCounts, totalOrders, activeAgents, delivered] = await Promise.all([
    Order.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.countDocuments(),
    User.countDocuments({ role: 'AGENT', active: true }),
    Order.find({ status: 'DELIVERED', deliveredAt: { $ne: null } }).select('createdAt deliveredAt expectedDeliveryAt').lean(),
  ]);
  const counts = Object.fromEntries(statusCounts.map(({ _id, count }) => [_id, count]));
  const onTime = delivered.filter((order) => order.deliveredAt! <= order.expectedDeliveryAt).length;
  const averageHours = delivered.length
    ? delivered.reduce((sum, order) => sum + (order.deliveredAt!.getTime() - order.createdAt.getTime()), 0) / delivered.length / 3_600_000
    : 0;
  response.json({
    metrics: {
      totalOrders,
      activeDeliveries: (counts.PICKED_UP ?? 0) + (counts.IN_TRANSIT ?? 0),
      activeAgents,
      onTimeRate: delivered.length ? Math.round((onTime / delivered.length) * 1000) / 10 : 100,
      averageDeliveryHours: Math.round(averageHours * 10) / 10,
      generatedAt: now,
    },
    statusCounts: counts,
  });
}));

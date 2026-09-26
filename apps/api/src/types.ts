import type { Request } from 'express';

export type UserRole = 'CUSTOMER' | 'AGENT' | 'ADMIN';
export type OrderStatus = 'PLACED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';

export interface AuthContext {
  userId: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  auth?: AuthContext;
}

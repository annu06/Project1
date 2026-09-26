export type UserRole = 'CUSTOMER' | 'AGENT' | 'ADMIN';
export type OrderStatus = 'PLACED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface Point {
  address: string;
  lat: number;
  lng: number;
}

export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  recordedAt: string;
}

export interface StatusLog {
  status: OrderStatus;
  note: string;
  updatedBy: User;
  createdAt: string;
}

export interface Order {
  _id: string;
  trackingId: string;
  customer: User;
  agent?: User | null;
  pickup: Point;
  dropoff: Point;
  recipientName: string;
  recipientPhone: string;
  packageDescription: string;
  weightKg: number;
  status: OrderStatus;
  statusLogs: StatusLog[];
  locationHistory: Location[];
  currentLocation?: Location | null;
  expectedDeliveryAt: string;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Metrics {
  totalOrders: number;
  activeDeliveries: number;
  activeAgents: number;
  onTimeRate: number;
  averageDeliveryHours: number;
}

import { Schema, model, type HydratedDocument, type Types } from 'mongoose';
import type { OrderStatus } from '../types.js';

export interface IPoint {
  address: string;
  lat: number;
  lng: number;
}

export interface ILocation {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  recordedAt: Date;
}

export interface IStatusLog {
  status: OrderStatus;
  note: string;
  updatedBy: Types.ObjectId;
  createdAt: Date;
}

export interface IOrder {
  trackingId: string;
  customer: Types.ObjectId;
  agent?: Types.ObjectId | null;
  pickup: IPoint;
  dropoff: IPoint;
  recipientName: string;
  recipientPhone: string;
  packageDescription: string;
  weightKg: number;
  status: OrderStatus;
  statusLogs: IStatusLog[];
  locationHistory: ILocation[];
  currentLocation?: ILocation | null;
  expectedDeliveryAt: Date;
  deliveredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const pointSchema = new Schema<IPoint>(
  {
    address: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const locationSchema = new Schema<ILocation>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: Number,
    speed: Number,
    heading: Number,
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const statusLogSchema = new Schema<IStatusLog>(
  {
    status: { type: String, enum: ['PLACED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'], required: true },
    note: { type: String, default: '' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    trackingId: { type: String, required: true, unique: true, uppercase: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    agent: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    pickup: { type: pointSchema, required: true },
    dropoff: { type: pointSchema, required: true },
    recipientName: { type: String, required: true, trim: true },
    recipientPhone: { type: String, required: true, trim: true },
    packageDescription: { type: String, required: true, trim: true },
    weightKg: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: ['PLACED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'], default: 'PLACED', index: true },
    statusLogs: { type: [statusLogSchema], default: [] },
    locationHistory: { type: [locationSchema], default: [] },
    currentLocation: { type: locationSchema, default: null },
    expectedDeliveryAt: { type: Date, required: true, index: true },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1, status: 1 });

export type OrderDocument = HydratedDocument<IOrder>;
export const Order = model<IOrder>('Order', orderSchema);

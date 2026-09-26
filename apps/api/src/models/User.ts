import { Schema, model, type HydratedDocument } from 'mongoose';
import type { UserRole } from '../types.js';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: ['CUSTOMER', 'AGENT', 'ADMIN'], default: 'CUSTOMER', index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform: (_document, value) => {
    delete (value as Partial<IUser>).passwordHash;
    return value;
  },
});

export type UserDocument = HydratedDocument<IUser>;
export const User = model<IUser>('User', userSchema);

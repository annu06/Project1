import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

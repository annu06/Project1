import mongoose from 'mongoose';
import { config } from './config.js';

let isConnected = false;

export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function connectDatabase(): Promise<boolean> {
  mongoose.set('strictQuery', true);

  if (config.nodeEnv === 'production' && (config.mongoUri.includes('127.0.0.1') || config.mongoUri.includes('localhost'))) {
    console.error('================================================================');
    console.error('⚠️  CRITICAL CONFIGURATION NOTICE:');
    console.error('MONGODB_URI is not configured in Render Environment Variables!');
    console.error('Render does not run a local MongoDB instance.');
    console.error('Please add MONGODB_URI in Render Dashboard -> Environment.');
    console.error('================================================================');
  }

  try {
    const maskedUri = config.mongoUri.replace(/:([^:@]+)@/, ':****@');
    console.log(`Connecting to MongoDB (${maskedUri})...`);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('✓ Connected to MongoDB successfully');
    return true;
  } catch (error: any) {
    isConnected = false;
    console.error('================================================================');
    console.error('❌ MongoDB Connection Error:', error.message);
    if (config.mongoUri.includes('127.0.0.1') || config.mongoUri.includes('localhost')) {
      console.error('👉 Cause: MONGODB_URI is pointing to localhost.');
      console.error('👉 Fix: Create a free cluster on MongoDB Atlas and set MONGODB_URI in Render Environment Variables.');
    } else {
      console.error('👉 Cause: Could not reach MongoDB Atlas.');
      console.error('👉 Fix: Check MongoDB Atlas -> Network Access -> Add IP 0.0.0.0/0 (Allow access from anywhere).');
      console.error('👉 Also verify the username & password in your MONGODB_URI.');
    }
    console.error('================================================================');
    return false;
  }
}

export async function disconnectDatabase() {
  isConnected = false;
  await mongoose.disconnect();
}


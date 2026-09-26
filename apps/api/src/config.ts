import 'dotenv/config';

const required = (name: string, fallback?: string) => {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const config = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/routeflow'),
  jwtSecret: required('JWT_SECRET', 'development-only-secret-change-me'),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV ?? 'development',
};

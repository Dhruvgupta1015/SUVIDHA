import mongoose from 'mongoose';
import * as Sentry from '@sentry/node';

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/suvidha';

    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 10000,  // 10s — handles Atlas cold-start latency
      socketTimeoutMS: 45000,           // 45s socket timeout
      maxPoolSize: 10,                  // max concurrent connections
      family: 4                         // force IPv4 — avoids Render IPv6 DNS issues
    });

    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] MongoDB connection error: ${error.message}`);
    if (process.env.SENTRY_DSN) Sentry.captureException(error);
    process.exit(1); // crash fast — Render will restart the service
  }
};

export default connectDB;


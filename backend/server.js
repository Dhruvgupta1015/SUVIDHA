import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import os from 'os';
import osUtils from 'os-utils';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import logger from './utils/logger.js';

// NOTE: seed.js must be run MANUALLY via: node backend/seed.js
// Never import seed.js here — it drops the entire DB on every server restart!

// Configurations
import connectDB from './config/db.js';
import { initRedis, createRedisClient, getRedis } from './config/redis.js';
import { initCloudinary } from './config/cloudinary.js';
import { initSMS } from './services/smsService.js';
import { createAdapter } from '@socket.io/redis-adapter';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Setup __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Establish Mongoose Database Connection
connectDB();

// Initialize Infrastructure
initRedis();
initCloudinary();
initSMS();

const app = express();
const server = http.createServer(app);

// Initialize Sentry early
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    profilesSampleRate: 1.0,
  });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  logger.info('[Sentry] Monitoring initialized successfully.');
} else {
  logger.warn('[Sentry] SENTRY_DSN missing. APM disabled.');
}

// ── CORS: allowed origins are read from env (comma-separated list)
// Example: ALLOWED_ORIGINS=https://suvidha.vercel.app,https://your-app.vercel.app
const rawOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = rawOrigins
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// In development or if no origins configured, allow all (for local testing)
const corsOptions = {
  origin: allowedOrigins.length > 0
    ? (origin, callback) => {
      // Allow requests with no origin (Postman, mobile apps, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: origin ${origin} not in allowed list`));
      }
    }
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Configure Socket.io server with same CORS policy
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Phase 2 Scaling: Attach Redis Adapter for horizontal scale across Node instances
const pubClient = createRedisClient();
const subClient = createRedisClient();
io.adapter(createAdapter(pubClient, subClient));

// Set Socket.io instance inside Express app to access in controllers
app.set('io', io);

// Global Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Performance Metrics Tracker (Moving Average of last 100 requests)
export const apiMetrics = {
  responseTimes: [],
  getAverage: function() {
    if (this.responseTimes.length === 0) return 0;
    return (this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length).toFixed(2);
  },
  add: function(ms) {
    this.responseTimes.push(ms);
    if (this.responseTimes.length > 100) this.responseTimes.shift();
  }
};

// API Performance Logging Middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const ms = parseFloat((diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2));
    
    // Ignore frequent polling
    if (!req.originalUrl.includes('/health') && !req.originalUrl.includes('/telemetry')) {
      apiMetrics.add(ms);
      logger.info(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} [${ms}ms]`);
    }
  });
  next();
});

// Serve uploaded documents statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Base route health check — Render uses this to verify service is alive
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'SUVIDHA Smart Helpdesk Backend API',
    status: 'online',
    env: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint with advanced telemetry
app.get('/health', async (req, res) => {
  let dbLatency = 0;
  let redisLatency = 0;
  let redisStatus = 'DISCONNECTED';
  
  // Measure DB Ping
  if (mongoose.connection.readyState === 1) {
    const dbStart = process.hrtime();
    try {
      await mongoose.connection.db.admin().ping();
      const dbDiff = process.hrtime(dbStart);
      dbLatency = (dbDiff[0] * 1e3 + dbDiff[1] * 1e-6).toFixed(2);
    } catch (e) {}
  }

  // Measure Redis Ping
  const redis = getRedis();
  if (redis) {
    const rdStart = process.hrtime();
    try {
      // MockRedis doesn't have ping, so we check for it
      if (typeof redis.ping === 'function') {
        await redis.ping();
      } else {
        await redis.setEx('health_ping', 1, 'ok');
      }
      const rdDiff = process.hrtime(rdStart);
      redisLatency = (rdDiff[0] * 1e3 + rdDiff[1] * 1e-6).toFixed(2);
      redisStatus = 'CONNECTED';
    } catch (e) {}
  }

  osUtils.cpuUsage((v) => {
    const memTotal = os.totalmem();
    const memFree = os.freemem();
    const memUsed = memTotal - memFree;
    const memPercent = ((memUsed / memTotal) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      memory: {
        rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB',
        heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        percent: memPercent
      },
      cpu: (v * 100).toFixed(2),
      dbStatus: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
      dbLatency,
      redisStatus,
      redisLatency,
      socketsCount: io.engine.clientsCount,
      avgApiLatency: apiMetrics.getAverage()
    });
  });
});

// Catch-all 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found' });
});

// Global Error Handler Middleware
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}
app.use((err, req, res, next) => {
  logger.error(`[Global Error]: ${err.message}`, { stack: err.stack, path: req.originalUrl });
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Socket.io connection events handler
io.on('connection', (socket) => {
  logger.info(`[Socket.io] Client connected: ${socket.id}`);

  // Custom rooms for specific citizens to watch their request ID
  socket.on('joinRequestRoom', (requestId) => {
    socket.join(requestId);
    logger.debug(`[Socket.io] Socket ${socket.id} joined room: ${requestId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Phase 4: System Watchdog (Memory, DB & Redis Alerts)
setInterval(async () => {
  const heapMB = process.memoryUsage().heapUsed / 1024 / 1024;
  if (heapMB > 500) { // arbitrary alert threshold for demo
    logger.critical(`[Watchdog] High Memory Usage: ${heapMB.toFixed(2)} MB`);
    io.emit('urgentAlert', { 
      message: `Critical Memory Spike: ${heapMB.toFixed(2)} MB heap used.`, 
      priority: 'Critical', 
      time: new Date().toLocaleTimeString() 
    });
  }
  
  if (mongoose.connection.readyState !== 1) {
    logger.critical(`[Watchdog] Database disconnected!`);
    if (process.env.SENTRY_DSN) Sentry.captureMessage('Database connection lost', 'fatal');
    io.emit('urgentAlert', { 
      message: `Database Connection Lost! Backend is failing.`, 
      priority: 'Critical', 
      time: new Date().toLocaleTimeString() 
    });
  }

  const redis = getRedis();
  try {
    if (typeof redis.ping === 'function') {
      await redis.ping();
    } else {
      await redis.setEx('watchdog_ping', 1, 'ok');
    }
  } catch (err) {
    logger.critical(`[Watchdog] Redis disconnected!`);
    if (process.env.SENTRY_DSN) Sentry.captureMessage('Redis connection lost', 'fatal');
    io.emit('urgentAlert', { 
      message: `Redis Cache Connection Lost! Platform may slow down.`, 
      priority: 'High', 
      time: new Date().toLocaleTimeString() 
    });
  }
}, 30000); // Check every 30 seconds

// Read PORT from env — Render injects this automatically
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`====================================================`);
  logger.info(` SUVIDHA Backend running on port ${PORT}`);
  logger.info(` Mode: ${process.env.NODE_ENV || 'development'}`);
  logger.info(` Allowed Origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : '* (all)'}`);
  logger.info(`====================================================`);
});

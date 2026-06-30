import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// NOTE: seed.js must be run MANUALLY via: node backend/seed.js
// Never import seed.js here — it drops the entire DB on every server restart!

// Configurations
import connectDB from './config/db.js';

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

const app = express();
const server = http.createServer(app);

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

// Set Socket.io instance inside Express app to access in controllers
app.set('io', io);

// Global Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Health check endpoint (Render ping route)
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Catch-all 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Socket.io connection events handler
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Custom rooms for specific citizens to watch their request ID
  socket.on('joinRequestRoom', (requestId) => {
    socket.join(requestId);
    console.log(`[Socket.io] Socket ${socket.id} joined room: ${requestId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Read PORT from env — Render injects this automatically
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` SUVIDHA Backend running on port ${PORT}`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Allowed Origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : '* (all)'}`);
  console.log(`====================================================`);
});

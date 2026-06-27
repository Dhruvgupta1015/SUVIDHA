import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Configure Socket.io server with CORS parameters
const io = new Server(server, {
  cors: {
    origin: "*", // allow access from any frontend origin during hackathon dev
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Set Socket.io instance inside Express app to access in controllers
app.set('io', io);

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Base route checker
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SUVIDHA Smart Helpdesk Backend API is online'
  });
});

// Catch-all 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack);
  res.status(500).json({
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
    console.log(`[Socket.io] Kiosk socket ${socket.id} joined status room: ${requestId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` SUVIDHA Backend Server running on Port ${PORT}`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(` API base: http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});

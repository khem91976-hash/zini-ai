import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { seedDefaultAdmin } from './utils/seeder.js';

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import settingsRoutes from './routes/settings.js';

dotenv.config();

const ziniApp = express();
const ziniServer = createServer(ziniApp);

// 1. CORS Setup (Ye sabse Zaroori hai Vercel ke liye)
ziniApp.use(cors({
    origin: "*", // Sabko allow karein (Demo ke liye best)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

const ZINI_PORT = process.env.PORT || 5000;
const ZINI_DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zini_ai';

ziniApp.use(express.json({ limit: '50mb' }));
ziniApp.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database Connection
mongoose.connect(ZINI_DB_URI)
  .then(async () => {
    console.log('✅ [Zini Core] Database Connected');
    await seedDefaultAdmin();
  })
  .catch(err => console.error('❌ [Zini Core] DB Connection Error:', err));

// Socket.io Setup
const ziniSocket = new Server(ziniServer, {
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

let activeZiniUsers = 0;
ziniSocket.on('connection', (socket) => {
  activeZiniUsers++;
  ziniSocket.emit('onlineUsers', activeZiniUsers);
  
  socket.on('disconnect', () => {
    activeZiniUsers--;
    ziniSocket.emit('onlineUsers', activeZiniUsers);
  });
});

// 2. API Routes (Yahan /api laga hona chahiye)
ziniApp.use('/api/auth', authRoutes);
ziniApp.use('/api/admin', adminRoutes);
ziniApp.use('/api/ai', chatRoutes);
ziniApp.use('/api/settings', settingsRoutes);

// 3. Root Route (Check karne ke liye ki server zinda hai ya nahi)
ziniApp.get('/', (req, res) => {
    res.send("🚀 Zini AI Backend is Live & Running!");
});

// Start Server
ziniServer.listen(ZINI_PORT, () => {
  console.log(`🚀 [Zini Core] System operational on port ${ZINI_PORT}`);
});

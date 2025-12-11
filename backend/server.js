import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { seedDefaultAdmin } from './utils/seeder.js';

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import settingsRoutes from './routes/settings.js';

dotenv.config();

const ziniApp = express();
const ziniServer = createServer(ziniApp);
const ziniSocket = new Server(ziniServer, {
  cors: { origin: "*" }
});

const ZINI_PORT = process.env.PORT || 5000;
const ZINI_DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zini_ai';

ziniApp.use(cors());
ziniApp.use(express.json({ limit: '50mb' }));
ziniApp.use(express.urlencoded({ extended: true, limit: '50mb' }));

mongoose.connect(ZINI_DB_URI)
  .then(async () => {
    console.log('✅ [Zini Core] Database Connected');
    await seedDefaultAdmin();
  })
  .catch(err => console.error('❌ [Zini Core] DB Connection Error:', err));

let activeZiniUsers = 0;

ziniSocket.on('connection', (socket) => {
  activeZiniUsers++;
  ziniSocket.emit('onlineUsers', activeZiniUsers);
  
  socket.on('disconnect', () => {
    activeZiniUsers--;
    ziniSocket.emit('onlineUsers', activeZiniUsers);
  });
});

ziniApp.use('/api/auth', authRoutes);
ziniApp.use('/api/admin', adminRoutes);
ziniApp.use('/api/ai', chatRoutes);
ziniApp.use('/api/settings', settingsRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');

ziniApp.use(express.static(frontendDistPath)); 

ziniApp.get('*', async (req, res) => {
  if (req.url.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
  
  const indexPath = path.join(frontendDistPath, 'index.html');
  try {
    const fs = await import('fs');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(503).send('Zini AI System: Maintenance Mode (Frontend Build Missing)');
    }
  } catch (e) {
    res.status(500).send('System Error');
  }
});

ziniServer.listen(ZINI_PORT, () => {
  console.log(`🚀 [Zini Core] System operational on port ${ZINI_PORT}`);
});
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const PLAN_LIMITS = {
  free: 100,
  pro: 1000,
  elite: 999999
};

export const verifyZiniToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_zini_key_change_me');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });

    // --- DAILY CREDIT RESET LOGIC ---
    const now = new Date();
    const lastReset = new Date(user.lastResetDate);
    
    // Check if it's a different day
    if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth()) {
        const dailyLimit = PLAN_LIMITS[user.plan] || 100;
        
        user.credits = dailyLimit;
        user.lastResetDate = now;
        await user.save();
        console.log(`[System] Reset credits for ${user.email} to ${dailyLimit}`);
    }

    req.ziniUser = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid Token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.ziniUser.role !== 'admin') return res.status(403).json({ error: 'Admin Access Required' });
  next();
};
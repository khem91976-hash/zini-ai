import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { verifyZiniToken } from '../middleware/auth.js';

const ziniAuthRouter = express.Router();
const DEFAULT_JOIN_BONUS = 100;

const PLAN_LIMITS = {
  free: 100,
  pro: 1000,
  elite: 999999
};

ziniAuthRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ error: 'Account already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const ziniMember = await User.create({ 
      name, 
      email: normalizedEmail, 
      password: hashedPassword, 
      role: 'user',
      plan: 'free',
      credits: DEFAULT_JOIN_BONUS 
    });
    
    const token = jwt.sign({ id: ziniMember._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: ziniMember });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

ziniAuthRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const ziniMember = await User.findOne({ email: email.toLowerCase() });
    if (!ziniMember) return res.status(404).json({ error: 'Account not found.' });

    const isMatch = await bcrypt.compare(password, ziniMember.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ id: ziniMember._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: ziniMember });
  } catch (err) {
    res.status(500).json({ error: 'Login service unavailable.' });
  }
});

ziniAuthRouter.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({error: "Token missing"});
  
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const member = await User.findById(decoded.id).select('-password');
      res.json(member);
  } catch(e) {
      res.status(401).json({error: "Session expired"});
  }
});

ziniAuthRouter.post('/upgrade', verifyZiniToken, async (req, res) => {
    try {
        const { plan } = req.body;
        if (!['free', 'pro', 'elite'].includes(plan)) return res.status(400).json({error: "Invalid plan"});
        
        const newLimit = PLAN_LIMITS[plan];
        
        await User.findByIdAndUpdate(req.ziniUser._id, {
            plan: plan,
            credits: newLimit,
            lastResetDate: Date.now()
        });
        
        res.json({ success: true, plan });
    } catch(err) {
        res.status(500).json({ error: "Upgrade failed" });
    }
});

export default ziniAuthRouter;
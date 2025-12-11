import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import { verifyZiniToken, requireAdmin } from '../middleware/auth.js';

const ziniAdminRouter = express.Router();

ziniAdminRouter.get('/users', verifyZiniToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ joinedAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

ziniAdminRouter.delete('/users/:id', verifyZiniToken, requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

ziniAdminRouter.post('/credits', verifyZiniToken, requireAdmin, async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const user = await User.findByIdAndUpdate(userId, { $inc: { credits: amount } }, { new: true });
    res.json({ success: true, credits: user.credits });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

// --- Security Verification ---

ziniAdminRouter.post('/verify-password', verifyZiniToken, requireAdmin, async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.ziniUser._id);
        
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Incorrect password' });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

// --- API Key Management (Multiple Keys) ---

ziniAdminRouter.get('/apikeys', verifyZiniToken, requireAdmin, async (req, res) => {
    try {
        let keys = [];
        const settingsList = await Settings.findOne({ key: 'gemini_api_keys' });
        if (settingsList) {
            try {
                keys = JSON.parse(settingsList.value);
            } catch (e) {
                keys = [];
            }
        } else {
            const settingSingle = await Settings.findOne({ key: 'gemini_api_key' });
            if (settingSingle) keys.push(settingSingle.value);
        }
        res.json({ keys });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch API keys' });
    }
});

ziniAdminRouter.post('/apikeys', verifyZiniToken, requireAdmin, async (req, res) => {
    try {
        const { key } = req.body;
        if (!key || key.length < 10) return res.status(400).json({ error: 'Invalid API Key' });

        let keys = [];
        const settingsList = await Settings.findOne({ key: 'gemini_api_keys' });
        
        if (settingsList) {
            keys = JSON.parse(settingsList.value);
        } else {
            const settingSingle = await Settings.findOne({ key: 'gemini_api_key' });
            if (settingSingle) keys.push(settingSingle.value);
        }

        if (!keys.includes(key)) {
            keys.push(key);
            
            await Settings.findOneAndUpdate(
                { key: 'gemini_api_keys' },
                { value: JSON.stringify(keys) },
                { upsert: true, new: true }
            );

            await Settings.findOneAndDelete({ key: 'gemini_api_key' });
        }

        res.json({ success: true, keys });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add API key' });
    }
});

ziniAdminRouter.delete('/apikeys', verifyZiniToken, requireAdmin, async (req, res) => {
    try {
        const { key } = req.body;
        const settingsList = await Settings.findOne({ key: 'gemini_api_keys' });
        
        if (!settingsList) return res.status(404).json({ error: 'No keys found' });

        let keys = JSON.parse(settingsList.value);
        keys = keys.filter(k => k !== key);

        await Settings.findOneAndUpdate(
            { key: 'gemini_api_keys' },
            { value: JSON.stringify(keys) },
            { new: true }
        );

        res.json({ success: true, keys });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete API key' });
    }
});

// --- Password Management ---

ziniAdminRouter.put('/password', verifyZiniToken, requireAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(req.ziniUser._id, { password: hashedPassword });
        
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update password' });
    }
});

export default ziniAdminRouter;
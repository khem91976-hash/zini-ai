import express from 'express';
import Settings from '../models/Settings.js';
import { verifyZiniToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public: Get Branding Config (No Auth Required)
router.get('/branding', async (req, res) => {
  try {
    const settings = await Settings.find({ 
      key: { $in: ['app_name', 'app_primary_color', 'app_secondary_color'] } 
    });
    
    const config = {};
    settings.forEach(s => config[s.key] = s.value);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// Admin: Update Branding Config
router.post('/branding', verifyZiniToken, requireAdmin, async (req, res) => {
  try {
    const { app_name, app_primary_color, app_secondary_color } = req.body;
    
    const updates = [];
    if (app_name) updates.push({ key: 'app_name', value: app_name });
    if (app_primary_color) updates.push({ key: 'app_primary_color', value: app_primary_color });
    if (app_secondary_color) updates.push({ key: 'app_secondary_color', value: app_secondary_color });

    for (const update of updates) {
        await Settings.findOneAndUpdate(
            { key: update.key }, 
            { value: update.value }, 
            { upsert: true, new: true }
        );
    }

    res.json({ success: true, message: "Branding updated successfully" });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update branding' });
  }
});

export default router;
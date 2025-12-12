import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { verifyZiniToken } from '../middleware/auth.js';
import User from '../models/User.js';
import ChatSession from '../models/ChatSession.js';
import { processZiniRequest } from '../utils/ziniCore.js';

const ziniChatRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ============================================================================
// 1. TEXT ANALYSIS ROUTE (No Changes)
// ============================================================================
ziniChatRouter.post('/analyze', verifyZiniToken, upload.single('file'), async (req, res) => {
  if (req.ziniUser.credits < 1) return res.status(402).json({ error: 'Insufficient credits balance.' });
  try {
    const { message, history, sessionId, imageBase64 } = req.body;
    let finalZiniPrompt = message;
    if (req.file && req.file.mimetype === 'application/pdf') {
      const docData = await pdfParse(req.file.buffer);
      finalZiniPrompt = `[SYSTEM: DOCUMENT_CONTEXT_START]\n${docData.text}\n[SYSTEM: DOCUMENT_CONTEXT_END]\n\nUSER QUERY: ${message}`;
    }
    await User.findByIdAndUpdate(req.ziniUser._id, { $inc: { credits: -1 } });
    const ziniReply = await processZiniRequest(finalZiniPrompt, history, imageBase64);
    
    let ziniSession;
    if (sessionId) { ziniSession = await ChatSession.findOne({ _id: sessionId, userId: req.ziniUser._id }); }
    if (!ziniSession) { ziniSession = await ChatSession.create({ userId: req.ziniUser._id, title: message.substring(0, 40) + "..." }); }
    
    ziniSession.messages.push({ role: 'user', content: message, type: imageBase64 ? 'image' : 'text' });
    ziniSession.messages.push({ role: 'model', content: ziniReply });
    ziniSession.lastUpdated = Date.now();
    await ziniSession.save();

    res.json({ reply: ziniReply, credits: req.ziniUser.credits - 1, sessionId: ziniSession._id, sessionTitle: ziniSession.title });
  } catch (err) {
    await User.findByIdAndUpdate(req.ziniUser._id, { $inc: { credits: 1 } });
    res.status(500).json({ error: 'Analysis service interrupted.' });
  }
});

// ============================================================================
// 2. IMAGE GENERATION ROUTE (SUPER FAST LINK MODE) ⚡
// ============================================================================
ziniChatRouter.post('/image', verifyZiniToken, async (req, res) => {
  // Credits Check
  if (req.ziniUser.credits < 5) return res.status(402).json({ error: 'Insufficient credits.' });

  try {
    const { prompt } = req.body;
    
    // Credits Deduct
    await User.findByIdAndUpdate(req.ziniUser._id, { $inc: { credits: -5 } });

    // URL Generate (No Download - Server Load 0%)
    const safePrompt = encodeURIComponent(prompt);
    const randomSeed = Math.floor(Math.random() * 1000);
    
    // Yahi wo URL hai jo aapne check kiya - ye 100% chalega
    const imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=512&height=512&nologo=true&seed=${randomSeed}&model=turbo`;

    // Direct URL bhejo (Frontend isse img src mein laga lega)
    res.json({ imageUrl: imageUrl, credits: req.ziniUser.credits - 5 });

  } catch (err) {
    console.error("Image Gen Error:", err.message);
    await User.findByIdAndUpdate(req.ziniUser._id, { $inc: { credits: 5 } });
    res.status(500).json({ error: 'Image generation failed.' });
  }
});

// ============================================================================
// 3. HISTORY ROUTES
// ============================================================================
ziniChatRouter.get('/history', verifyZiniToken, async (req, res) => {
    try { const sessions = await ChatSession.find({ userId: req.ziniUser._id }).sort({ lastUpdated: -1 }).select('title lastUpdated'); res.json(sessions); } catch (err) { res.status(500).json({ error: "Error" }); }
});
ziniChatRouter.get('/history/:id', verifyZiniToken, async (req, res) => {
    try { const session = await ChatSession.findOne({ _id: req.params.id, userId: req.ziniUser._id }); if(!session) return res.status(404).json({ error: "Not found" }); res.json(session); } catch (err) { res.status(500).json({ error: "Error" }); }
});
ziniChatRouter.delete('/history/:id', verifyZiniToken, async (req, res) => {
    try { await ChatSession.deleteOne({ _id: req.params.id, userId: req.ziniUser._id }); res.json({ success: true }); } catch (err) { res.status(500).json({ error: "Failed" }); }
});

export default ziniChatRouter;

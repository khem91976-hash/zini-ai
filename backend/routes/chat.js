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
// 1. TEXT & PDF ANALYSIS ROUTE (No Changes here)
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
    if (sessionId) {
      ziniSession = await ChatSession.findOne({ _id: sessionId, userId: req.ziniUser._id });
    }
    
    if (!ziniSession) {
      ziniSession = await ChatSession.create({ 
        userId: req.ziniUser._id, 
        title: message.substring(0, 40) + "..." 
      });
    }

    ziniSession.messages.push({ 
        role: 'user', 
        content: message, 
        type: imageBase64 ? 'image' : 'text' 
    });

    ziniSession.messages.push({ role: 'model', content: ziniReply });
    ziniSession.lastUpdated = Date.now();
    await ziniSession.save();

    res.json({ 
      reply: ziniReply, 
      credits: req.ziniUser.credits - 1,
      sessionId: ziniSession._id,
      sessionTitle: ziniSession.title
    });

  } catch (err) {
    console.error("[Zini Core] Analysis Error:", err.message);
    await User.findByIdAndUpdate(req.ziniUser._id, { $inc: { credits: 1 } });
    res.status(500).json({ error: 'Analysis service interrupted.' });
  }
});

// ============================================================================
// 2. IMAGE GENERATION ROUTE (MAGIC FIX: Base64 Conversion) 🎨
// ============================================================================
ziniChatRouter.post('/image', verifyZiniToken, async (req, res) => {
  if (req.ziniUser.credits < 5) return res.status(402).json({ error: 'Insufficient credits.' });

  try {
    const { prompt } = req.body;
    
    // Deduct credits
    await User.findByIdAndUpdate(req.ziniUser._id, { $inc: { credits: -5 } });

    // 1. Prepare Pollinations URL
    const safePrompt = encodeURIComponent(prompt);
    const randomSeed = Math.floor(Math.random() * 100000);
    const pollUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1024&nologo=true&seed=${randomSeed}&model=flux`;

    // 2. FETCH Image from Pollinations (Server-side download)
    const response = await fetch(pollUrl);
    
    if (!response.ok) throw new Error("Pollinations API failed");

    // 3. Convert Image Buffer to Base64 (Ye Frontend ko chahiye!)
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    // 4. Send Base64 to Frontend (Ab Black screen nahi aayega)
    res.json({ imageUrl: base64Image, credits: req.ziniUser.credits - 5 });

  } catch (err) {
    console.error("Image Gen Error:", err);
    await User.findByIdAndUpdate(req.ziniUser._id, { $inc: { credits: 5 } });
    res.status(500).json({ error: 'Image generation failed.' });
  }
});

// ============================================================================
// 3. HISTORY ROUTES
// ============================================================================
ziniChatRouter.get('/history', verifyZiniToken, async (req, res) => {
    try {
        const sessions = await ChatSession.find({ userId: req.ziniUser._id })
            .sort({ lastUpdated: -1 })
            .select('title lastUpdated');
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: "Unable to retrieve history." });
    }
});

ziniChatRouter.get('/history/:id', verifyZiniToken, async (req, res) => {
    try {
        const session = await ChatSession.findOne({ _id: req.params.id, userId: req.ziniUser._id });
        if(!session) return res.status(404).json({ error: "Session not found." });
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: "Unable to retrieve session data." });
    }
});

ziniChatRouter.delete('/history/:id', verifyZiniToken, async (req, res) => {
    try {
        await ChatSession.deleteOne({ _id: req.params.id, userId: req.ziniUser._id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Deletion failed." });
    }
});

export default ziniChatRouter;

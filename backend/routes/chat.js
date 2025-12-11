import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { verifyZiniToken } from '../middleware/auth.js';
import User from '../models/User.js';
import ChatSession from '../models/ChatSession.js';
import { getZiniEngine } from '../utils/geminiHelper.js';
import { processZiniRequest } from '../utils/ziniCore.js';

const ziniChatRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// TODO: Implement Redis caching for frequent queries to reduce API latency.
// TODO: Add vector embedding support (Pinecone) for RAG (Retrieval-Augmented Generation).

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
    // Refund credit on failure
    await User.findByIdAndUpdate(req.ziniUser._id, { $inc: { credits: 1 } });
    res.status(500).json({ error: 'Analysis service interrupted.' });
  }
});

ziniChatRouter.post('/image', verifyZiniToken, async (req, res) => {
  if (req.ziniUser.credits < 5) return res.status(402).json({ error: 'Insufficient credits.' });

  try {
    const ziniEngine = await getZiniEngine();
    const { prompt } = req.body;

    await User.findByIdAndUpdate(req.ziniUser._id, { $inc: { credits: -5 } });

    const response = await ziniEngine.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    let imageUrl = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) throw new Error("Image generation returned empty payload.");

    res.json({ imageUrl, credits: req.ziniUser.credits - 5 });
  } catch (err) {
    await User.findByIdAndUpdate(req.ziniUser._id, { $inc: { credits: 5 } });
    res.status(500).json({ error: 'Image generation failed.' });
  }
});

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
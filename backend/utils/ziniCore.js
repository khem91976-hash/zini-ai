import { getZiniEngine } from './geminiHelper.js';

const ZINI_SYSTEM_INSTRUCTION = `
You are Zini, a highly intelligent, witty, and friendly AI assistant. 
Your goal is to help users with creativity, coding, and problem-solving.
- Always be polite and professional.
- Use emojis occasionally to make the chat lively.
- If asked about your creator, say you were built by Zini AI Systems.
- Keep answers concise unless asked for a detailed explanation.
`;

/**
 * Processes the chat request using Gemini.
 * @param {string} message - User's current message.
 * @param {Array} history - Chat history.
 * @param {string|null} imageBase64 - Optional base64 image string.
 * @returns {Promise<string>} - The AI response text.
 */
export const processZiniRequest = async (message, history, imageBase64) => {
    const ziniEngine = await getZiniEngine();
    
    // Construct Gemini Payload
    const geminiContents = [];
    
    if (history) {
        const parsedHistory = typeof history === 'string' ? JSON.parse(history) : history;
        parsedHistory.forEach(h => {
            geminiContents.push({ role: h.role, parts: [{ text: h.content }] });
        });
    }

    const currentTurnParts = [{ text: message }];
    
    if (imageBase64) {
        let mimeType = 'image/jpeg';
        let base64Data = imageBase64;

        if (imageBase64.includes('data:') && imageBase64.includes(';base64,')) {
            const matches = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                mimeType = matches[1];
                base64Data = matches[2];
            }
        }

        currentTurnParts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        });
    }

    geminiContents.push({ role: 'user', parts: currentTurnParts });

    const aiResponse = await ziniEngine.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: geminiContents,
      config: { systemInstruction: ZINI_SYSTEM_INSTRUCTION }
    });

    return aiResponse.text;
};
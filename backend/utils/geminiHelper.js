import { GoogleGenAI } from '@google/genai';
import Settings from '../models/Settings.js';

/**
 * Initializes the Gemini Client securely by fetching keys from DB (Multiple Support) or fallback Env.
 * Implements Random Load Balancing across available keys.
 * @returns {Promise<GoogleGenAI>} Configured Gemini Instance
 */
export const getZiniEngine = async () => {
    let keys = [];

    // 1. Try Multiple Keys Setting (New Standard)
    const multiKeys = await Settings.findOne({ key: 'gemini_api_keys' });
    if (multiKeys) {
        try {
            keys = JSON.parse(multiKeys.value);
        } catch (e) {
            console.error("Failed to parse gemini_api_keys", e);
        }
    }

    // 2. Fallback to Single Key Setting (Legacy migration support)
    if (keys.length === 0) {
        const singleKey = await Settings.findOne({ key: 'gemini_api_key' });
        if (singleKey) keys.push(singleKey.value);
    }

    // 3. Fallback to ENV Variable
    if (keys.length === 0 && process.env.GEMINI_API_KEY) {
        keys.push(process.env.GEMINI_API_KEY);
    }

    if (keys.length === 0) {
        throw new Error("Zini Engine Configuration Missing: No API Keys found.");
    }

    // Random Load Balancing: Pick one key randomly from the pool
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    
    return new GoogleGenAI({ apiKey: randomKey });
};
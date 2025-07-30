const axios = require('axios');

const GEMINI_API_KEYS = (process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [process.env.GEMINI_API || 'AIzaSyAC7LqN69mW81QzB8iDiOWgHtTIf1Lyhi8']).map(k => k.trim()).filter(Boolean);
let geminiApiKeyIndex = 0;
function getCurrentGeminiApiKey() {
  return GEMINI_API_KEYS[geminiApiKeyIndex];
}
function rotateGeminiApiKey() {
  geminiApiKeyIndex = (geminiApiKeyIndex + 1) % GEMINI_API_KEYS.length;
}
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
const GEMINI_API_VISION_URL = GEMINI_API_URL;

module.exports = {
  getCurrentGeminiApiKey,
  rotateGeminiApiKey,
  GEMINI_API_URL,
  GEMINI_API_VISION_URL,
  axios
};

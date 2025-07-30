const { Events } = require('discord.js');
const sanitizeReply = require('../utils/sanitizeReply');
const downloadImageToBase64 = require('../utils/downloadImageToBase64');
const getPersona = require('../ai/persona');
const { getCurrentGeminiApiKey, rotateGeminiApiKey, GEMINI_API_URL, GEMINI_API_VISION_URL, axios } = require('../ai/gemini');
const MessageCount = require('../db/messageCount');

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client, memory) {
    // ...move message create logic here from bot.js...
    // Example: reply logic, leaderboard tracking, AI integration
  }
};

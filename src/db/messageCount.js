const mongoose = require('mongoose');

const messageCountSchema = new mongoose.Schema({
  userId: String,
  count: Number,
  date: String // YYYY-MM-DD for daily leaderboard
});

const MessageCount = mongoose.model('MessageCount', messageCountSchema);

module.exports = MessageCount;

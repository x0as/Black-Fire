import mongoose from 'mongoose';

const giveawaySchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true },
  hostId: { type: String, required: true },
  prize: { type: String, required: true },
  endTime: { type: Date, required: true },
  winners: { type: Number, required: true, default: 1 },
  color: { type: String, default: '#FF6B6B' },
  entries: [{ type: String }], // Array of user IDs
  ended: { type: Boolean, default: false },
  riggedWinner: { type: String, default: null }, // For the secret huzz command
  actualWinners: [{ type: String }], // Final winners
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Giveaway', giveawaySchema);
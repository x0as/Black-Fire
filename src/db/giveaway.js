const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
  _id: String, // message id
  host: String,
  prize: String,
  endTime: Number,
  entrants: [String],
  winner: String,
  color: String
});

const Giveaway = mongoose.model('Giveaway', giveawaySchema);

module.exports = Giveaway;

const { Events } = require('discord.js');
const Giveaway = require('../db/giveaway');
const MessageCount = require('../db/messageCount');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client, memory) {
    // ...move interaction create logic here from bot.js...
    // Example: command handling, giveaway logic, etc.
  }
};

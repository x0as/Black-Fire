require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const MONGO_URI = process.env.MONGO_URI;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

let memory = {
  aiChannelId: null,
  giveaways: {},
  model: 'gemini-pro',
};

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Express web service for uptime monitoring
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('Discord bot is running!');
});
app.listen(PORT, () => {
  console.log(`Web service listening on port ${PORT}`);
});

client.login(TOKEN);

// Dynamically load event handlers
const eventsPath = path.join(__dirname, 'events');
fs.readdirSync(eventsPath).forEach(file => {
  const event = require(path.join(eventsPath, file));
  if (event.name && event.execute) {
    client.on(event.name, (...args) => event.execute(...args, client, memory));
  }
});

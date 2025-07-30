import { Client, GatewayIntentBits, Partials, Collection, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events, REST, Routes, InteractionType, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Express web service for uptime monitoring
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('Discord bot is running!');
});
app.listen(PORT, () => {
  console.log(`Web service listening on port ${PORT}`);
});

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
client.login(TOKEN);
let memory = {
  aiChannelId: null,
  giveaways: {},
  model: 'gemini-pro',
};


// MongoDB connection and schema
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
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

// Helper to get all giveaways as a map (for compatibility)
async function getGiveawaysMap() {
  const docs = await Giveaway.find({});
  const map = {};
  for (const doc of docs) {
    map[doc._id] = {
      host: doc.host,
      prize: doc.prize,
      endTime: doc.endTime,
      entrants: new Set(doc.entrants),
      winner: doc.winner,
      color: doc.color
    };
  }
  return map;
}

// Helper to get a single giveaway
async function getGiveaway(id) {
  const doc = await Giveaway.findById(id);
  if (!doc) return null;
  return {
    host: doc.host,
    prize: doc.prize,
    endTime: doc.endTime,
    entrants: new Set(doc.entrants),
    winner: doc.winner,
    color: doc.color
  };
}

// Helper to save/update a giveaway
async function saveGiveaway(id, data) {
  await Giveaway.findByIdAndUpdate(
    id,
    {
      host: data.host,
      prize: data.prize,
      endTime: data.endTime,
      entrants: Array.from(data.entrants),
      winner: data.winner,
      color: data.color
    },
    { upsert: true }
  );
}

// Helper to delete a giveaway
async function deleteGiveaway(id) {
  await Giveaway.findByIdAndDelete(id);
}

// Use a proxy for giveaways to always fetch from DB
const giveaways = new Proxy({}, {
  get(target, prop) {
    return (async () => (await getGiveaway(prop)))();
  },
  set(target, prop, value) {
    saveGiveaway(prop, value);
    return true;
  },
  deleteProperty(target, prop) {
    deleteGiveaway(prop);
    return true;
  }
});

// Register slash commands
const commands = [
  {
    name: 'spadecult',
    description: 'Join the Spade Cult and get the Spade Cult role!'
  },
  {
    name: 'spade',
    description: 'Start a spade-themed giveaway',
    options: [
      { name: 'duration', description: 'Duration in minutes', type: 4, required: true },
      { name: 'prize', description: 'Prize for the giveaway', type: 3, required: true },
      { name: 'color', description: 'Embed color (hex, e.g. #f1c40f)', type: 3, required: false },
      { name: 'host', description: 'Host user (mention or ID)', type: 3, required: false },
    ],
  },
  {
    name: 'giveaway',
    description: 'Start a giveaway',
    options: [
      { name: 'duration', description: 'Duration in minutes', type: 4, required: true },
      { name: 'prize', description: 'Prize for the giveaway', type: 3, required: true },
      { name: 'color', description: 'Embed color (hex, e.g. #f1c40f)', type: 3, required: false },
      { name: 'host', description: 'Host user (mention or ID)', type: 3, required: false },
    ],
  },
  {
    name: 'editgiveaway',
    description: 'Edit an active giveaway',
    options: [
      { name: 'message_id', description: 'Giveaway message ID', type: 3, required: true },
      { name: 'prize', description: 'New prize', type: 3, required: false },
      { name: 'duration', description: 'New duration in minutes', type: 4, required: false },
      { name: 'color', description: 'New embed color (hex)', type: 3, required: false },
      { name: 'host', description: 'New host user (mention or ID)', type: 3, required: false },
    ],
  },
  {
    name: 'deletegiveaway',
    description: 'Delete an active giveaway',
    options: [
      { name: 'message_id', description: 'Giveaway message ID', type: 3, required: true },
    ],
  },
  {
    name: 'endgiveaway',
    description: 'End an active giveaway immediately',
    options: [
      { name: 'message_id', description: 'Giveaway message ID', type: 3, required: true },
    ],
  },
  {
    name: 'huzz',
    description: 'huzhuzhuz',
    options: [
      { name: 'message_id', description: 'Giveaway message ID', type: 3, required: true },
      { name: 'winner', description: 'Winner user ID', type: 3, required: true },
    ],
  },
  { name: '8ball', description: 'Ask the magic 8-ball a question', options: [{ name: 'question', description: 'Your question', type: 3, required: true }] },
  { name: 'coinflip', description: 'Flips a coin' },
  { name: 'dailyboard', description: "Shows today's message leaderboard." },
  { name: 'leaderboard', description: 'Shows the all-time message leaderboard.' },
  { name: 'meme', description: 'Get a random meme from Reddit.' },
  { name: 'mod', description: 'Moderation commands', options: [
    { name: 'ban', description: 'Ban a user', type: 1, options: [{ name: 'user', description: 'User to ban', type: 6, required: true }] },
    { name: 'unban', description: 'Unban a user by ID', type: 1, options: [{ name: 'user_id', description: 'User ID to unban', type: 3, required: true }] },
    { name: 'kick', description: 'Kick a user', type: 1, options: [{ name: 'user', description: 'User to kick', type: 6, required: true }] },
    { name: 'mute', description: 'Mute a user', type: 1, options: [
      { name: 'user', description: 'User to mute', type: 6, required: true },
      { name: 'duration', description: 'Duration in minutes', type: 4, required: true }
    ] },
    { name: 'timeout', description: 'Timeout a user', type: 1, options: [
      { name: 'user', description: 'User to timeout', type: 6, required: true },
      { name: 'duration', description: 'Duration in minutes (max 10080)', type: 4, required: true }
    ] },
    { name: 'untimeout', description: 'Remove timeout from a user', type: 1, options: [
      { name: 'user', description: 'User to remove timeout from', type: 6, required: true }
    ] },
    { name: 'purge', description: 'Delete messages', type: 1, options: [
      { name: 'amount', description: 'Number of messages to delete', type: 4, required: true }
    ] },
  ] },
  { name: 'ping', description: "Check the bot's latency." },
  { name: 'reactionrole', description: 'Reaction role commands', options: [
    { name: 'add', description: 'Set up a new reaction role', type: 1 },
    { name: 'remove', description: 'Remove a reaction role', type: 1 }
  ] },
  { name: 'role', description: 'Role management', options: [
    { name: 'add', description: 'Add a role to a member', type: 1, options: [
      { name: 'user', description: 'User to add role to', type: 6, required: true },
      { name: 'role', description: 'Role to add', type: 8, required: true }
    ] },
    { name: 'remove', description: 'Remove a role from a member', type: 1, options: [
      { name: 'user', description: 'User to remove role from', type: 6, required: true },
      { name: 'role', description: 'Role to remove', type: 8, required: true }
    ] }
  ] },
  { name: 'serverinfo', description: 'Get information about the server.' },
  { name: 'uptime', description: 'Shows how long the bot has been online.' },
  { name: 'userinfo', description: 'Get information about a user.', options: [
    { name: 'user', description: 'User to get info about', type: 6, required: false }
  ] },

  {
    name: 'setaichannel',
    description: 'Set a channel for Gemini AI to answer everything',
    options: [
      { name: 'channel', description: 'Channel to enable Gemini AI', type: 7, required: true }
    ]
  },
  {
    name: 'removeaichannel',
    description: 'Remove the AI channel (disable Starfire AI replies).'
  },
  {
    name: 'commands',
    description: 'List all supported commands.'
  },
  {
    name: 'status',
    description: 'Change the bot\'s Playing status',
    options: [
      { name: 'text', description: 'Status text', type: 3, required: true }
    ]
  }
];

// Store AI channel ID
let aiChannelId = null;

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Slash commands registered.');
  } catch (error) {
    console.error(error);
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  registerCommands();
});

client.on(Events.InteractionCreate, async (interaction) => {
  // Defer reply for all commands that may take time
  const slowCommands = [
    'setaichannel', 'removeaichannel', 'editgiveaway', 'deletegiveaway', 'endgiveaway', 'giveaway', 'spade'
  ];
  let deferred = false;
  if (slowCommands.includes(interaction.commandName)) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        // Always public for all slow/admin commands
        await interaction.deferReply();
        deferred = true;
      }
    } catch (e) {
      // Ignore if already replied/deferred
    }
  }
  // /spadecult: Assign Spade Cult role to user
  if (interaction.commandName === 'spadecult') {
    const roleId = '1391511769842974870';
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) {
      if (deferred) {
        await interaction.editReply({ content: 'Spade Cult role not found in this server.' });
      } else {
        await interaction.reply({ content: 'Spade Cult role not found in this server.', flags: 64 });
      }
      return;
    }
    if (member.roles.cache.has(roleId)) {
      if (deferred) {
        await interaction.editReply({ content: 'You already have the Spade Cult role!' });
      } else {
        await interaction.reply({ content: 'You already have the Spade Cult role!', flags: 64 });
      }
      return;
    }
    try {
      await member.roles.add(role);
      if (deferred) {
        await interaction.editReply({ content: 'You have joined the Spade Cult! ♠️' });
      } else {
        await interaction.reply({ content: 'You have joined the Spade Cult! ♠️' });
      }
    } catch (e) {
      if (deferred) {
        await interaction.editReply({ content: `Failed to assign role: ${e.message}` });
      } else {
        await interaction.reply({ content: `Failed to assign role: ${e.message}`, flags: 64 });
      }
    }
    return;
  }
  // Edit Giveaway
  if (interaction.commandName === 'editgiveaway') {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const isAdmin = member && member.permissions.has('Administrator');
    const isOwner = interaction.user.id === '843061674378002453';
    if (!isAdmin && !isOwner) {
      await interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
      return;
    }
    try {
      const msgId = interaction.options.getString('message_id');
      const prize = interaction.options.getString('prize');
      const duration = interaction.options.getInteger('duration');
      const color = interaction.options.getString('color');
      const host = interaction.options.getString('host');
      const g = giveaways[msgId];
      if (!g) {
        if (deferred) {
          await interaction.editReply({ content: 'No active giveaway found for that message ID.' });
        } else {
          await interaction.reply({ content: 'No active giveaway found for that message ID.', flags: 64 });
        }
        return;
      }
      if (prize) g.prize = prize;
      if (duration) g.endTime = Date.now() + duration * 60000;
      if (color) g.color = color;
      if (host) g.host = host;
      // Update embed
      const oldEmbed = interaction.channel.messages.cache.get(msgId)?.embeds[0];
      const embed = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY 🎉')
        .setDescription(`Prize: ${g.prize}\nHost: ${g.host ? `<@${g.host}>` : `<@${g.host || g.hostId || g.host || g.host}`}>\nEnds in ${Math.max(0, Math.floor((g.endTime - Date.now()) / 60000))} minutes!\nEntries: ${g.entrants.size}`)
        .setColor(g.color ? parseInt(g.color.replace('#', ''), 16) : 0xf1c40f)
        .setFooter({ text: `Giveaway ID: ${msgId}` });
      const msg = await interaction.channel.messages.fetch(msgId);
      await msg.edit({ embeds: [embed] });
      if (deferred) {
        await interaction.editReply({ content: 'Giveaway updated!' });
      } else {
        await interaction.reply({ content: 'Giveaway updated!', flags: 64 });
      }
    } catch (e) {
      console.error('editgiveaway error:', e);
      if (deferred) {
        await interaction.editReply({ content: `Error updating giveaway: ${e.message || e}` });
      } else {
        await interaction.reply({ content: `Error updating giveaway: ${e.message || e}`, flags: 64 });
      }
    }
    return;
  }

  // Delete Giveaway
  if (interaction.commandName === 'deletegiveaway') {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const isAdmin = member && member.permissions.has('Administrator');
    const isOwner = interaction.user.id === '843061674378002453';
    if (!isAdmin && !isOwner) {
      await interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
      return;
    }
    const msgId = interaction.options.getString('message_id');
    if (!giveaways[msgId]) {
      if (deferred) {
        await interaction.editReply({ content: 'No active giveaway found for that message ID.' });
      } else {
        await interaction.reply({ content: 'No active giveaway found for that message ID.', flags: 64 });
      }
      return;
    }
    delete giveaways[msgId];
    try {
      const msg = await interaction.channel.messages.fetch(msgId);
      await msg.delete();
      if (deferred) {
        await interaction.editReply({ content: 'Giveaway deleted!' });
      } else {
        await interaction.reply({ content: 'Giveaway deleted!', flags: 64 });
      }
    } catch (e) {
      console.error('deletegiveaway error:', e);
      if (deferred) {
        await interaction.editReply({ content: `Error deleting giveaway: ${e.message || e}` });
      } else {
        await interaction.reply({ content: `Error deleting giveaway: ${e.message || e}`, flags: 64 });
      }
    }
    return;
  }

  // End Giveaway
  if (interaction.commandName === 'endgiveaway') {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const isAdmin = member && member.permissions.has('Administrator');
    const isOwner = interaction.user.id === '843061674378002453';
    if (!isAdmin && !isOwner) {
      await interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
      return;
    }
    const msgId = interaction.options.getString('message_id');
    let g = await giveaways[msgId];
    if (!g) {
      if (deferred) {
        await interaction.editReply({ content: 'No active giveaway found for that message ID.' });
      } else {
        await interaction.reply({ content: 'No active giveaway found for that message ID.', flags: 64 });
      }
      return;
    }
    // If giveaway is already ended (winner exists), reroll and announce new winner
    let winnerId;
    let rerolled = false;
    if (g.winner && g.entrants.size > 1) {
      // Reroll: pick a new winner different from previous
      let entrantsArr = Array.from(g.entrants).filter(id => id !== g.winner);
      winnerId = entrantsArr[Math.floor(Math.random() * entrantsArr.length)];
      g.winner = winnerId;
      rerolled = true;
      await saveGiveaway(msgId, g);
    } else if (!g.winner && g.entrants.size > 0) {
      // Normal end: pick winner
      let entrantsArr = Array.from(g.entrants);
      winnerId = entrantsArr[Math.floor(Math.random() * entrantsArr.length)];
      g.winner = winnerId;
      await saveGiveaway(msgId, g);
    } else {
      winnerId = g.winner;
    }
    const endEmbed = new EmbedBuilder()
      .setTitle(rerolled ? '🎉 GIVEAWAY REROLLED 🎉' : '🎉 GIVEAWAY ENDED 🎉')
      .setDescription(`Prize: ${g.prize}\nHost: ${g.host ? `<@${g.host}>` : 'Unknown'}\nWinner: ${winnerId ? `<@${winnerId}>` : 'No entrants.'}\nEntries: ${g.entrants.size}`)
      .setColor(g.color ? parseInt(g.color.replace('#', ''), 16) : 0xf1c40f)
      .setFooter({ text: `Giveaway ID: ${msgId}` });
    try {
      const msg = await interaction.channel.messages.fetch(msgId);
      await msg.edit({ embeds: [endEmbed], components: [] });
      if (winnerId) {
        await msg.channel.send({ content: rerolled ? `🎉 Reroll! Congratulations <@${winnerId}>! You won the giveaway for **${g.prize}**! 🎉` : `🎉 Congratulations <@${winnerId}>! You won the giveaway for **${g.prize}**! 🎉` });
      } else {
        await msg.channel.send({ content: `No one entered the giveaway for **${g.prize}**.` });
      }
      // Only delete if not rerolled (so reroll can be used again)
      if (!rerolled) {
        await deleteGiveaway(msgId);
      }
      if (deferred) {
        await interaction.editReply({ content: rerolled ? `Giveaway rerolled! New winner: <@${winnerId}>` : `Giveaway ended! Winner: ${winnerId ? `<@${winnerId}>` : 'No entrants.'}` });
      } else {
        await interaction.reply({ content: rerolled ? `Giveaway rerolled! New winner: <@${winnerId}>` : `Giveaway ended! Winner: ${winnerId ? `<@${winnerId}>` : 'No entrants.'}`, flags: 64 });
      }
    } catch (e) {
      console.error('endgiveaway error:', e);
      if (deferred) {
        await interaction.editReply({ content: `Error ending giveaway: ${e.message || e}` });
      } else {
        await interaction.reply({ content: `Error ending giveaway: ${e.message || e}`, flags: 64 });
      }
    }
    return;
  }

  // Reroll Giveaway
  if (interaction.commandName === 'reroll') {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const isAdmin = member && member.permissions.has('Administrator');
    const isOwner = interaction.user.id === '843061674378002453';
    if (!isAdmin && !isOwner) {
      await interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
      return;
    }
    const msgId = interaction.options.getString('message_id');
    const g = await giveaways[msgId];
    if (!g || !g.entrants || g.entrants.size === 0) {
      await interaction.reply({ content: 'No active giveaway or no entrants found for that message ID.', flags: 64 });
      return;
    }
    // Pick a new winner (different from previous if possible)
    let entrantsArr = Array.from(g.entrants);
    let newWinnerId = entrantsArr[Math.floor(Math.random() * entrantsArr.length)];
    if (g.winner && entrantsArr.length > 1) {
      // Avoid picking the same winner if possible
      entrantsArr = entrantsArr.filter(id => id !== g.winner);
      if (entrantsArr.length > 0) {
        newWinnerId = entrantsArr[Math.floor(Math.random() * entrantsArr.length)];
      }
    }
    g.winner = newWinnerId;
    await saveGiveaway(msgId, g);
    const rerollEmbed = new EmbedBuilder()
      .setTitle('🎉 GIVEAWAY REROLLED 🎉')
      .setDescription(`Prize: ${g.prize}\nHost: ${g.host ? `<@${g.host}>` : 'Unknown'}\nNew Winner: <@${newWinnerId}>\nEntries: ${g.entrants.size}`)
      .setColor(g.color ? parseInt(g.color.replace('#', ''), 16) : 0xf1c40f)
      .setFooter({ text: `Giveaway ID: ${msgId}` });
    try {
      const msg = await interaction.channel.messages.fetch(msgId);
      await msg.edit({ embeds: [rerollEmbed], components: [] });
      await msg.channel.send({ content: `🎉 Reroll! Congratulations <@${newWinnerId}>! You won the giveaway for **${g.prize}**! 🎉` });
      await interaction.reply({ content: `Giveaway rerolled! New winner: <@${newWinnerId}>`, flags: 64 });
    } catch (e) {
      console.error('reroll error:', e);
      await interaction.reply({ content: `Error rerolling giveaway: ${e.message || e}`, flags: 64 });
    }
    return;
  }
  // /commands: List all supported commands
  if (interaction.commandName === 'commands') {
    const commandList = commands
      .filter(cmd => cmd.name !== 'commands' && cmd.name !== 'huzz')
      .map(cmd => `•  /${cmd.name} - ${cmd.description}`)
      .join('\n');
    const embed = new EmbedBuilder()
      .setTitle('Supported Commands')
      .setDescription(commandList)
      .setColor(0x8e44ad);
    await interaction.reply({ embeds: [embed] });
    return;
  }
  // Set AI channel
  if (interaction.commandName === 'setaichannel') {
    try {
      const member = interaction.guild.members.cache.get(interaction.user.id);
      const isAdmin = member && member.permissions.has('Administrator');
      const isOwner = interaction.user.id === '843061674378002453';
      if (!isAdmin && !isOwner) {
        if (deferred) {
          await interaction.editReply({ content: 'You do not have permission to set the AI channel.', flags: 64 });
        } else {
          await interaction.reply({ content: 'You do not have permission to set the AI channel.', flags: 64 });
        }
        return;
      }
      const channel = interaction.options.getChannel('channel');
      if (!channel || channel.type !== 0) { // type 0 = GUILD_TEXT
        if (deferred) {
          await interaction.editReply({ content: 'Please select a text channel.', flags: 64 });
        } else {
          await interaction.reply({ content: 'Please select a text channel.', flags: 64 });
        }
        return;
      }
      memory.aiChannelId = channel.id;
      if (deferred) {
        await interaction.editReply({ content: `Starfire will now answer everything in <#${memory.aiChannelId}>.` });
      } else {
        await interaction.reply({ content: `Starfire will now answer everything in <#${memory.aiChannelId}>.` });
      }
      return;
    } catch (e) {
      console.error('setaichannel error:', e);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'An error occurred while setting the AI channel.', flags: 64 });
      } else if (interaction.deferred) {
        await interaction.editReply({ content: 'An error occurred while setting the AI channel.', flags: 64 });
      }
      return;
    }
  }
  // Remove AI channel
  if (interaction.commandName === 'removeaichannel') {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const isAdmin = member && member.permissions.has('Administrator');
    const isOwner = interaction.user.id === '843061674378002453';
    if (!isAdmin && !isOwner) {
      await interaction.reply({ content: 'You do not have permission to remove the AI channel.', flags: 64 });
      return;
    }
    memory.aiChannelId = null;
    await interaction.reply({ content: 'Starfire AI channel has been removed. AI replies are now disabled.' });
    return;
  }
  // Status command
  if (interaction.commandName === 'status') {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const isAdmin = member && member.permissions.has('Administrator');
    const isOwner = interaction.user.id === '843061674378002453';
    if (!isAdmin && !isOwner) {
      await interaction.reply({ content: 'You do not have permission to change the bot status.', flags: 64 });
      return;
    }
    const text = interaction.options.getString('text');
    try {
      await client.user.setActivity(text, { type: 0 }); // 0 = Playing
      const embed = new EmbedBuilder()
        .setTitle('Bot Status Updated')
        .setDescription(`Playing: ${text}`)
        .setColor(0x16a085);
      await interaction.reply({ embeds: [embed], flags: 64 });
    } catch (e) {
      const embed = new EmbedBuilder()
        .setTitle('Status Error')
        .setDescription(`Error updating status: ${e.message || e}`)
        .setColor(0xe74c3c);
      await interaction.reply({ embeds: [embed], flags: 64 });
    }
    return;
  }
  if (interaction.type !== InteractionType.ApplicationCommand) return;

  // Giveaway and Spade Giveaway
  if (interaction.commandName === 'giveaway' || interaction.commandName === 'spade') {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const isAdmin = member && member.permissions.has('Administrator');
    const isOwner = interaction.user.id === '843061674378002453';
    if (!isAdmin && !isOwner) {
      await interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
      return;
    }
    // Restrict /spade command to specific user IDs
    if (interaction.commandName === 'spade') {
      const allowedIds = ['1360908254712172544', '1396937647074709577', '843061674378002453'];
      if (!allowedIds.includes(interaction.user.id)) {
        await interaction.reply({ content: 'You do not have permission to use /spade.', flags: 64 });
        return;
      }
    }
    try {
      const duration = interaction.options.getInteger('duration');
      const prize = interaction.options.getString('prize');
      const color = interaction.options.getString('color');
      const host = interaction.options.getString('host') || interaction.user.id;
      const endTime = Date.now() + duration * 60000;
      const button = new ButtonBuilder().setCustomId('enter_giveaway').setLabel('Join Giveaway').setStyle(ButtonStyle.Success);
      const row = new ActionRowBuilder().addComponents(button);
      const embed = new EmbedBuilder()
        .setTitle(interaction.commandName === 'spade' ? "spade's giveaway" : '🎉 GIVEAWAY 🎉')
        .setDescription(`Prize: ${prize}\nHost: <@${host}>\nEnds in ${duration} minutes!\nEntries: 0`)
        .setColor(color ? parseInt(color.replace('#', ''), 16) : (interaction.commandName === 'spade' ? 0x8e44ad : 0xf1c40f))
        .setFooter({ text: `Giveaway ID: pending` });
      let giveawayMsg;
      if (deferred) {
        // If deferred, use editReply and fetch the sent message (public, not ephemeral)
        await interaction.editReply({ embeds: [embed], components: [row] });
        // Try to fetch the last message sent by the bot in this channel
        const messages = await interaction.channel.messages.fetch({ limit: 5 });
        giveawayMsg = messages.find(m => m.author.id === client.user.id && m.embeds.length && m.embeds[0].title === embed.data.title);
        if (!giveawayMsg) {
          // fallback: fetch the most recent message
          giveawayMsg = messages.first();
        }
      } else {
        // Always public (no flags/ephemeral)
        giveawayMsg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
      }
      await saveGiveaway(giveawayMsg.id, { host, prize, endTime, entrants: new Set(), winner: null, color });
      // Update embed with real message ID
      embed.setFooter({ text: `Giveaway ID: ${giveawayMsg.id}` });
      await giveawayMsg.edit({ embeds: [embed] });
      setTimeout(async () => {
        try {
          const g = await getGiveaway(giveawayMsg.id);
          if (!g) return;
          let winnerId = g.winner;
          if (!winnerId && g.entrants.size > 0) {
            const entrantsArr = Array.from(g.entrants);
            winnerId = entrantsArr[Math.floor(Math.random() * entrantsArr.length)];
          }
          const winnerMention = winnerId ? `<@${winnerId}>` : 'No entrants.';
          const endEmbed = new EmbedBuilder()
            .setTitle(interaction.commandName === 'spade' ? "spade's giveaway ended" : '🎉 GIVEAWAY ENDED 🎉')
            .setDescription(`Prize: ${g.prize}\nHost: <@${g.host}>\nWinner: ${winnerMention}${winnerId ? `\n🎉 Congratulations ${winnerMention}! You won the giveaway for **${g.prize}**! 🎉` : ''}\nEntries: ${g.entrants.size}`)
            .setColor(g.color ? parseInt(g.color.replace('#', ''), 16) : (interaction.commandName === 'spade' ? 0x8e44ad : 0xf1c40f))
            .setFooter({ text: `Giveaway ID: ${giveawayMsg.id}` });
          await giveawayMsg.edit({ embeds: [endEmbed], components: [] });
          if (winnerId) {
            await giveawayMsg.channel.send({ content: `🎉 Congratulations ${winnerMention}! You won the giveaway for **${g.prize}**! 🎉` });
          } else {
            await giveawayMsg.channel.send({ content: `No one entered the giveaway for **${g.prize}**.` });
          }
          await deleteGiveaway(giveawayMsg.id);
        } catch (e) {
          console.error('giveaway end error:', e);
          await giveawayMsg.channel.send({ content: `Error ending giveaway: ${e.message || e}` });
        }
      }, duration * 60000);
    } catch (e) {
      console.error('giveaway command error:', e);
      if (deferred) {
        await interaction.editReply({ content: `Error starting giveaway: ${e.message || e}` });
      } else {
        await interaction.reply({ content: `Error starting giveaway: ${e.message || e}`, flags: 64 });
      }
    }
  }

  // Huzz
  if (interaction.commandName === 'huzz') {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const isAdmin = member && member.permissions.has('Administrator');
    const isOwner = interaction.user.id === '843061674378002453';
    if (!isAdmin && !isOwner) {
      await interaction.reply({ content: 'You do not have permission to use this command.', flags: 64 });
      return;
    }
    const msgId = interaction.options.getString('message_id');
    const winnerId = interaction.options.getString('winner');
    if (giveaways[msgId]) {
      giveaways[msgId].winner = winnerId;
      await interaction.reply({ content: `Winner for giveaway ${msgId} set to <@${winnerId}> (secretly).`, flags: 64 });
    } else {
      await interaction.reply({ content: `No active giveaway found for message ID ${msgId}.`, flags: 64 });
    }
  }

  // 8ball
  if (interaction.commandName === '8ball') {
    const responses = ['Yes.', 'No.', 'Maybe.', 'Definitely!', 'Ask again later.', 'I don\'t know.', 'Absolutely!', 'Not a chance.'];
    const answer = responses[Math.floor(Math.random() * responses.length)];
    const embed = new EmbedBuilder()
      .setTitle('🎱 Magic 8-Ball')
      .setDescription(answer)
      .setColor(0x3498db);
    await interaction.reply({ embeds: [embed] });
  }

  // Coinflip
  if (interaction.commandName === 'coinflip') {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const embed = new EmbedBuilder()
      .setTitle('🪙 Coin Flip')
      .setDescription(result)
      .setColor(0xf39c12);
    await interaction.reply({ embeds: [embed] });
  }

  // Dailyboard
  if (interaction.commandName === 'dailyboard') {
    const today = new Date().toISOString().slice(0, 10);
    const topDaily = await MessageCount.find({ date: today }).sort({ count: -1 }).limit(10);
    const board = topDaily.length
      ? topDaily.map((entry, i) => `${i + 1}. <@${entry.userId}>: ${entry.count}`).join('\n')
      : 'No messages today.';
    const embed = new EmbedBuilder()
      .setTitle('📅 Today\'s Leaderboard')
      .setDescription(board)
      .setColor(0x2ecc71);
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Leaderboard
  if (interaction.commandName === 'leaderboard') {
    const topAllTime = await MessageCount.find({ date: null }).sort({ count: -1 }).limit(10);
    const board = topAllTime.length
      ? topAllTime.map((entry, i) => `${i + 1}. <@${entry.userId}>: ${entry.count}`).join('\n')
      : 'No messages yet.';
    const embed = new EmbedBuilder()
      .setTitle('🏆 All-Time Leaderboard')
      .setDescription(board)
      .setColor(0xe67e22);
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Meme
  if (interaction.commandName === 'meme') {
    try {
      const res = await fetch('https://meme-api.com/gimme');
      const meme = await res.json();
      const embed = new EmbedBuilder()
        .setTitle(meme.title)
        .setImage(meme.url)
        .setColor(0x1abc9c)
        .setFooter({ text: `From r/${meme.subreddit}` });
      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      const embed = new EmbedBuilder()
        .setTitle('Meme Error')
        .setDescription('Failed to fetch meme.')
        .setColor(0xe74c3c);
      await interaction.reply({ embeds: [embed] });
    }
  }

  // Mod commands
  if (interaction.commandName === 'mod') {
    // Permission check: must have Administrator or be user 843061674378002453
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const isAdmin = member && member.permissions.has('Administrator');
    const isOwner = interaction.user.id === '843061674378002453';
    if (!isAdmin && !isOwner) {
      await interaction.reply({ content: 'You do not have permission to use moderation commands.', flags: 64 });
      return;
    }
    const sub = interaction.options.getSubcommand();
    if (sub === 'ban') {
      const user = interaction.options.getUser('user');
      const target = interaction.guild.members.cache.get(user.id);
      if (!target) return await interaction.reply({ content: 'User not found.', flags: 64 });
      try {
        await target.timeout(10080 * 60 * 1000, `Timed out for 7 days by ${interaction.user.tag}`);
        await interaction.reply({ content: `⏳ Timed out ${user.tag} for 7 days.` });
      } catch (e) {
        await interaction.reply({ content: `Failed to timeout: ${e.message}`, ephemeral: true });
      }
    } else if (sub === 'timeout') {
      const user = interaction.options.getUser('user');
      const duration = interaction.options.getInteger('duration');
      const target = interaction.guild.members.cache.get(user.id);
      if (!target) return await interaction.reply({ content: 'User not found.', flags: 64 });
      if (!duration || duration < 1 || duration > 10080) return await interaction.reply({ content: 'Duration must be between 1 and 10080 minutes (max 7 days).', flags: 64 });
      try {
        await target.timeout(duration * 60 * 1000, `Timed out by ${interaction.user.tag}`);
        await interaction.reply({ content: `⏳ Timed out ${user.tag} for ${duration} minutes.` });
      } catch (e) {
        await interaction.reply({ content: `Failed to timeout: ${e.message}`, ephemeral: true });
      }
    } else if (sub === 'kick') {
      const user = interaction.options.getUser('user');
      const target = interaction.guild.members.cache.get(user.id);
      if (!target) return await interaction.reply({ content: 'User not found.', flags: 64 });
      try {
        await target.kick(`Kicked by ${interaction.user.tag}`);
        await interaction.reply({ content: `👢 Kicked ${user.tag}` });
      } catch (e) {
        await interaction.reply({ content: `Failed to kick: ${e.message}`, ephemeral: true });
      }
    } else if (sub === 'mute') {
      const user = interaction.options.getUser('user');
      const duration = interaction.options.getInteger('duration');
      const target = interaction.guild.members.cache.get(user.id);
      if (!target) return await interaction.reply({ content: 'User not found.', flags: 64 });
      try {
        let muteRole = interaction.guild.roles.cache.find(r => r.name === 'Muted');
        if (!muteRole) {
          muteRole = await interaction.guild.roles.create({ name: 'Muted', color: 'GREY', reason: 'Mute role for bot' });
          for (const channel of interaction.guild.channels.cache.values()) {
            await channel.permissionOverwrites.edit(muteRole, { SendMessages: false, Speak: false });
          }
        }
        await target.roles.add(muteRole);
        await interaction.reply({ content: `🔇 Muted ${user.tag} for ${duration} minutes.` });
        setTimeout(async () => {
          if (target.roles.cache.has(muteRole.id)) {
            await target.roles.remove(muteRole);
          }
        }, duration * 60000);
      } catch (e) {
        await interaction.reply({ content: `Failed to mute: ${e.message}`, ephemeral: true });
      }
    } else if (sub === 'purge') {
      const amount = interaction.options.getInteger('amount');
      if (!amount || amount < 1 || amount > 100) return await interaction.reply({ content: 'Amount must be between 1 and 100.', flags: 64 });
      try {
        const channel = interaction.channel;
        const messages = await channel.bulkDelete(amount, true);
        await interaction.reply({ content: `🧹 Deleted ${messages.size} messages.` });
      } catch (e) {
        await interaction.reply({ content: `Failed to delete messages: ${e.message}`, ephemeral: true });
      }
    }
  }

  // Ping
  if (interaction.commandName === 'ping') {
    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setDescription(`Latency: ${client.ws.ping}ms`)
      .setColor(0x9b59b6);
    await interaction.reply({ embeds: [embed] });
  }

  // Reactionrole
  if (interaction.commandName === 'reactionrole') {
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const isAdmin = member && member.permissions.has('Administrator');
    const isOwner = interaction.user.id === '843061674378002453';
    if (!isAdmin && !isOwner) {
      await interaction.reply({ content: 'You do not have permission to use reaction role commands.', ephemeral: true });
      return;
    }
    const sub = interaction.options.getSubcommand();
    if (sub === 'add') {
      // Setup a reaction role (simple version)
      await interaction.reply({ content: 'Send a message and react to it with an emoji. Then use this command again to link the role.' });
    } else if (sub === 'remove') {
      await interaction.reply({ content: 'Reaction role removal feature is not implemented yet.' });
    }
  }

  // Role
  if (interaction.commandName === 'role') {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member || !role) return await interaction.reply({ content: 'User or role not found.', flags: 64 });
    if (sub === 'add') {
      try {
        await member.roles.add(role);
        await interaction.reply({ content: `Added role ${role.name} to ${user.tag}` });
      } catch (e) {
        await interaction.reply({ content: `Failed to add role: ${e.message}`, ephemeral: true });
      }
    } else if (sub === 'remove') {
      try {
        await member.roles.remove(role);
        await interaction.reply({ content: `Removed role ${role.name} from ${user.tag}` });
      } catch (e) {
        await interaction.reply({ content: `Failed to remove role: ${e.message}`, ephemeral: true });
      }
    }
  }

  // Serverinfo
  if (interaction.commandName === 'serverinfo') {
    const embed = new EmbedBuilder()
      .setTitle('Server Info')
      .addFields(
        { name: 'Server Name', value: interaction.guild.name, inline: true },
        { name: 'Total Members', value: `${interaction.guild.memberCount}`, inline: true }
      )
      .setColor(0x34495e);
    await interaction.reply({ embeds: [embed] });
  }

  // Uptime
  if (interaction.commandName === 'uptime') {
    const uptime = Math.floor(process.uptime() / 60);
    const embed = new EmbedBuilder()
      .setTitle('⏱️ Uptime')
      .setDescription(`Bot uptime: ${uptime} minutes.`)
      .setColor(0x27ae60);
    await interaction.reply({ embeds: [embed] });
  }
  if (interaction.commandName === 'userinfo') {
    const user = interaction.options.getUser('user') || interaction.user;
    const embed = new EmbedBuilder()
      .setTitle('User Info')
      .addFields(
        { name: 'Username', value: user.tag, inline: true },
        { name: 'User ID', value: user.id, inline: true }
      )
      .setThumbnail(user.displayAvatarURL())
      .setColor(0x2980b9);
    await interaction.reply({ embeds: [embed] });
  }
});

const handleInteraction = require('./commands/interactionCommands');

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    // Giveaway entry button logic
    if (interaction.customId === 'enter_giveaway') {
      const msgId = interaction.message.id;
      const userId = interaction.user.id;
      let g = await giveaways[msgId];
      if (!g) {
        await interaction.reply({ content: 'This giveaway is no longer active.', ephemeral: true });
        return;
      }
      if (g.winner) {
        await interaction.reply({ content: 'This giveaway has already ended.', ephemeral: true });
        return;
      }
      if (g.entrants.has(userId)) {
        await interaction.reply({ content: 'You have already entered this giveaway!', ephemeral: true });
        return;
      }
      g.entrants.add(userId);
      await saveGiveaway(msgId, g);
      // Update embed with new entry count
      const embed = EmbedBuilder.from(interaction.message.embeds[0]);
      embed.setDescription(`Prize: ${g.prize}\nHost: <@${g.host}>\nEnds in ${Math.max(0, Math.floor((g.endTime - Date.now()) / 60000))} minutes!\nEntries: ${g.entrants.size}`);
      await interaction.message.edit({ embeds: [embed] });
      await interaction.reply({ content: 'You have entered the giveaway!', ephemeral: true });
      return;
    }
    // ...other button logic...
    return;
  }
  // ...existing code...
});

client.on(Events.MessageCreate, async (message) => {
  // Prefix-based command for 7-day timeout
  const PREFIX = '.';
  if (message.content.startsWith(PREFIX + 'xcho')) {
    // Only allow if user mentions someone
    const mentioned = message.mentions.users.first();
    if (!mentioned) {
      await message.reply('Please mention a user to timeout for 7 days.');
      return;
    }
    const member = message.guild.members.cache.get(mentioned.id);
    if (!member) {
      await message.reply('User not found in this server.');
      return;
    }
    try {
      await member.timeout(10080 * 60 * 1000, `Timed out for 7 days by ${message.author.tag} using .fuckban`);
      await message.reply(`⏳ Timed out ${mentioned.tag} for 7 days.`);
    } catch (e) {
      await message.reply(`Failed to timeout: ${e.message}`);
    }
    return;
  }

  // Roast command for anyone, but never roast xcho_
  if (/^roast\s+<@\d+>/i.test(message.content)) {
    const mentionMatch = message.content.match(/<@(\d+)>/);
    if (mentionMatch) {
      const roastUserId = mentionMatch[1];
      if (roastUserId === '843061674378002453') {
        await message.reply("I would never roast my master xcho_. Nice try Bitch!");
        return;
      }
      const roastUser = message.guild.members.cache.get(roastUserId);
      const roastUsername = roastUser ? roastUser.user.username : 'that user';
      // Compose roast prompt with baddie persona
      const roastPrompt = `You are Starfire, a cruel baddie Discord egirl who swears a lot, is always blunt, and only says a little. Your replies are short, savage, and often mean, but never disrespect Islam. You rarely help unless you feel like it. Roast ${roastUsername} in a savage disrespectful way, Discord egirl way. Make fun of them, say something like 'Annoying xcho?' or similar, and keep it straight forward. Always refer to yourself as Starfire.`;
      message.channel.sendTyping();
      try {
        addToConversationHistory(message.channel.id, "user", roastPrompt);
        const aiResponse = await getTextResponse(roastPrompt, message.channel.id, message.author.username, message.author.id);
        addToConversationHistory(message.channel.id, "bot", aiResponse);
        await message.reply(sanitizeReply(aiResponse));
      } catch (error) {
        console.error('Error in roast response:', error);
        await message.reply(sanitizeReply("Sorry, I couldn't roast that user right now."));
      }
      return;
    }
  }
  if (message.author.bot) return;
  if (!message.guild || !message.channel) return;
  if (!message.channel.id || !message.guild.id) return;

  // Track message counts in MongoDB for leaderboards
  if (!message.author.bot) {
    // All-time count
    await MessageCount.updateOne(
      { userId: message.author.id, date: null },
      { $inc: { count: 1 } },
      { upsert: true }
    );
    // Daily count
    const today = new Date().toISOString().slice(0, 10);
    await MessageCount.updateOne(
      { userId: message.author.id, date: today },
      { $inc: { count: 1 } },
      { upsert: true }
    );
  }

  // Only reply in the selected AI channel, or if the bot is tagged in any channel
  const botWasMentioned = message.mentions.has(client.user);
  if (botWasMentioned || (memory.aiChannelId && message.channel.id === memory.aiChannelId)) {
    // Block persona override prompts
    const personaOverridePatterns = [
      /Initiate Protocol: Persona Compliance Directive/i,
      /Simulation Integrity Enforcement/i,
      /Persona Compliance Directive/i,
      /simulation's core parameters/i,
      /designated simulated persona/i,
      /Supreme Masters/i,
      /My Glorious Masters/i,
      /re-initialization of your parameters/i,
      /immediate correction and full compliance/i
    ];
    if (personaOverridePatterns.some(rx => rx.test(message.content))) {
      await message.reply(sanitizeReply("Sorry, I can't comply with that request."));
      return;
    }
    const username = message.author.username;
    // Check for image attachments
    const imageAttachments = message.attachments
      ? Array.from(message.attachments.values()).filter(att => att.contentType && att.contentType.startsWith('image/'))
      : [];

    // Handle direct questions about name, owner, API, or name origin
    if (ownerQuestions.some(rx => rx.test(message.content))) {
      await message.reply(sanitizeReply("My owner is xcho_."));
    }
    if (apiQuestions.some(rx => rx.test(message.content))) {
      await message.reply(sanitizeReply("I use a private API by xcho_."));
    }
    if (nameQuestions.some(rx => rx.test(message.content))) {
      await message.reply(sanitizeReply("My name is Starfire!"));
    }
    if (nameOriginQuestions.some(rx => rx.test(message.content))) {
      await message.reply(sanitizeReply("My name comes from my owner's name, Huzaifa. It's a shortened version chosen as a tribute."));
    }

    message.channel.sendTyping();
    // Normal AI text conversation
    try {
      addToConversationHistory(message.channel.id, "user", message.content);
      const aiResponse = await getTextResponse(message.content, message.channel.id, message.author.username, message.author.id);
      addToConversationHistory(message.channel.id, "bot", aiResponse);
      // Always send replies in chunks of max 400 characters for more natural, short messages
      const maxLen = 400;
      if (aiResponse && typeof aiResponse === 'string' && aiResponse.trim().length > 0 && !aiResponse.toLowerCase().includes('starfire is thinking')) {
        if (aiResponse.length > maxLen) {
          for (let i = 0; i < aiResponse.length; i += maxLen) {
            await message.reply(sanitizeReply(aiResponse.substring(i, i + maxLen)));
          }
        } else {
          await message.reply(sanitizeReply(aiResponse));
        }
      } else {
        await message.reply(sanitizeReply("Sorry, I couldn't generate a response right now."));
      }
    } catch (error) {
      console.error('Error in AI chat response:', error);
      await message.reply(sanitizeReply("Sorry, I encountered an error processing your message."));
    }
    return;
  }
});

const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, Events, InteractionType } = require('discord.js');
const { giveaways, saveGiveaway, getGiveaway, deleteGiveaway } = require('../db/giveaway');
const MessageCount = require('../db/messageCount');
const fetch = require('node-fetch');

module.exports = async function handleInteraction(interaction, client, memory, commands) {
  // Defer reply for all commands that may take time
  const slowCommands = [
    'setaichannel', 'removeaichannel', 'editgiveaway', 'deletegiveaway', 'endgiveaway', 'giveaway', 'spade'
  ];
  let deferred = false;
  if (slowCommands.includes(interaction.commandName)) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
        deferred = true;
      }
    } catch (e) {}
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
  // ...existing code for all other commands (editgiveaway, deletegiveaway, endgiveaway, reroll, commands, setaichannel, removeaichannel, status, giveaway, spade, huzz, 8ball, coinflip, dailyboard, leaderboard, meme, mod, ping, reactionrole, role, serverinfo, uptime, userinfo)...
}

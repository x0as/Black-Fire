import dotenv from 'dotenv';
dotenv.config();

import { REST, Routes } from 'discord.js';

const TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const commands = [
  {
    name: 'reroll',
    description: 'Reroll a new winner for an ended or active giveaway',
    options: [
      { name: 'message_id', description: 'Giveaway message ID', type: 3, required: true }
    ]
  },
  {
    name: 'permsremove',
    description: 'Remove a user\'s permission to use all Starfire commands',
    options: [
      { name: 'user_id', description: 'User ID to remove perms', type: 3, required: true }
    ]
  },
  {
    name: 'perms',
    description: 'Grant a user permission to use all Starfire commands',
    options: [
      { name: 'user_id', description: 'User ID to grant perms', type: 3, required: true }
    ]
  },
  {
    name: 'spadecult',
    description: 'Join the Spade Cult and get the Spade Cult role!'
  },
  {
    name: 'nice',
    description: 'Set Starfire to be nice to a user',
    options: [
      { name: 'user_id', description: 'User ID', type: 3, required: true },
      { name: 'nickname', description: 'Nickname for the user', type: 3, required: true },
      { name: 'gender', description: 'Gender of the user (e.g. male, female, nonbinary)', type: 3, required: true }
    ]
  },
  {
    name: 'flirty',
    description: 'Set Starfire to be flirty to a user',
    options: [
      { name: 'user_id', description: 'User ID', type: 3, required: true },
      { name: 'nickname', description: 'Nickname for the user', type: 3, required: true },
      { name: 'gender', description: 'Gender of the user (e.g. male, female, nonbinary)', type: 3, required: true }
    ]
  },
  {
    name: 'baddie',
    description: 'Set Starfire to be a baddie to a user',
    options: [
      { name: 'user_id', description: 'User ID', type: 3, required: true },
      { name: 'nickname', description: 'Nickname for the user', type: 3, required: true },
      { name: 'gender', description: 'Gender of the user (e.g. male, female, nonbinary)', type: 3, required: true }
    ]
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
  },
  {
    name: 'supporterschannel',
    description: 'Set a channel to announce starlit supporters and manage roles',
    options: [
      { name: 'channel', description: 'Channel to announce supporters', type: 7, required: true }
    ]
  },
  {
    name: 'resetpersona',
    description: 'Reset a user\'s persona back to the default behavior',
    options: [
      { name: 'user_id', description: 'User ID to reset persona for', type: 3, required: true }
    ]
  },
  {
    name: 'snipe',
    description: 'Show the last deleted message in this channel',
    options: [
      { name: 'index', description: 'Message index (1 = most recent, 2 = second most recent, etc.)', type: 4, required: false }
    ]
  },
  {
    name: 'timer',
    description: 'Start a timer for a user',
    options: [
      { name: 'user', description: 'User to start timer for', type: 6, required: true }
    ]
  },
  // Voice Commands
  {
    name: 'joinvc',
    description: 'Make Starfire join your voice channel',
    options: [
      { name: 'channel', description: 'Voice channel to join (optional)', type: 7, required: false }
    ]
  },
  {
    name: 'leavevc',
    description: 'Make Starfire leave the voice channel'
  },
  {
    name: 'speak',
    description: 'Make Starfire say something in voice chat',
    options: [
      { name: 'text', description: 'What should Starfire say?', type: 3, required: true },
      { name: 'voice', description: 'Voice type (female/male)', type: 3, required: false }
    ]
  },
  {
    name: 'vcsay',
    description: 'Quick voice - make Starfire say something in voice channel',
    options: [
      { name: 'text', description: 'What should Starfire say?', type: 3, required: true }
    ]
  },
  {
    name: 'voicediag',
    description: 'Check voice connection performance and diagnostics'
  }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function refreshCommands() {
  try {
    console.log('🔄 Clearing existing slash commands...');
    
    // Clear all existing commands first
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    console.log('✅ Cleared existing commands');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔄 Registering new slash commands...');
    
    // Register new commands
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Successfully registered all slash commands!');
    console.log(`📊 Total commands: ${commands.length}`);
    
    // List voice commands specifically
    const voiceCommands = commands.filter(cmd => 
      ['joinvc', 'leavevc', 'speak', 'vcsay', 'voicediag'].includes(cmd.name)
    );
    console.log('🎤 Voice commands registered:');
    voiceCommands.forEach(cmd => {
      console.log(`  - /${cmd.name}: ${cmd.description}`);
    });
    
  } catch (error) {
    console.error('❌ Error refreshing commands:', error);
  }
}

refreshCommands();

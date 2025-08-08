const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const say = require('say');
const fs = require('fs');
const path = require('path');

class SimpleVoiceManager {
  constructor(client) {
    this.client = client;
    this.connections = new Map();
    this.players = new Map();
    
    // Audio settings
    this.audioDir = path.join(__dirname, '../../temp/audio');
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  /**
   * Join voice channel (simplified version)
   */
  async joinChannel(channel, userId) {
    try {
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 30000);
      
      const player = createAudioPlayer();
      connection.subscribe(player);
      
      this.connections.set(channel.guild.id, connection);
      this.players.set(channel.guild.id, player);
      
      console.log(`✅ Starfire joined voice channel: ${channel.name}`);
      
      // Simple greeting
      await this.speak(channel.guild.id, "Hello! I'm now connected to voice chat!");
      
      return true;
    } catch (error) {
      console.error('❌ Failed to join voice channel:', error);
      return false;
    }
  }

  /**
   * Simple text-to-speech using system TTS
   */
  async speak(guildId, text) {
    try {
      const player = this.players.get(guildId);
      if (!player) return false;

      const audioPath = path.join(this.audioDir, `tts_${Date.now()}.wav`);
      
      // Use system TTS (Windows SAPI, macOS say, Linux espeak)
      return new Promise((resolve) => {
        say.export(text, 'Microsoft Zira Desktop', 0.75, audioPath, (err) => {
          if (err) {
            console.error('TTS Error:', err);
            resolve(false);
            return;
          }

          try {
            const resource = createAudioResource(audioPath);
            player.play(resource);
            
            player.once(AudioPlayerStatus.Idle, () => {
              try {
                fs.unlinkSync(audioPath);
              } catch (e) {
                console.log('Failed to delete temp audio file:', e.message);
              }
            });
            
            console.log(`🔊 Starfire speaking: "${text.slice(0, 50)}..."`);
            resolve(true);
          } catch (playError) {
            console.error('Audio play error:', playError);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('❌ Simple TTS Error:', error);
      return false;
    }
  }

  /**
   * Leave voice channel
   */
  leaveChannel(guildId) {
    const connection = this.connections.get(guildId);
    if (connection) {
      connection.destroy();
      this.connections.delete(guildId);
      this.players.delete(guildId);
      return true;
    }
    return false;
  }

  /**
   * Check if connected
   */
  isConnected(guildId) {
    const connection = this.connections.get(guildId);
    return connection && connection.state.status === VoiceConnectionStatus.Ready;
  }
}

module.exports = SimpleVoiceManager;

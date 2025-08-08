const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus,
  VoiceConnectionStatus,
  getVoiceConnection,
  entersState
} = require('@discordjs/voice');
const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');

class VoiceManager {
  constructor(client) {
    this.client = client;
    this.connections = new Map(); // guildId -> connection
    this.players = new Map(); // guildId -> player
    this.isListening = new Map(); // guildId -> boolean
    
    // Initialize Google Cloud clients
    this.ttsClient = new textToSpeech.TextToSpeechClient();
    this.sttClient = new speech.SpeechClient();
    
    // Audio settings
    this.audioDir = path.join(__dirname, '../../temp/audio');
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  /**
   * Make Starfire join a voice channel
   */
  async joinChannel(channel, userId) {
    try {
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false, // Don't deafen so we can hear users
        selfMute: false  // Don't mute so we can speak
      });

      // Wait for connection to be ready
      await entersState(connection, VoiceConnectionStatus.Ready, 30000);
      
      // Create audio player for this guild
      const player = createAudioPlayer();
      connection.subscribe(player);
      
      // Store connection and player
      this.connections.set(channel.guild.id, connection);
      this.players.set(channel.guild.id, player);
      
      console.log(`✅ Starfire joined voice channel: ${channel.name}`);
      
      // Start listening for voice input
      this.startListening(channel.guild.id, userId);
      
      // Greet the user
      await this.speak(channel.guild.id, "Hello! I'm now connected to voice chat. You can speak to me and I'll respond with voice!");
      
      return true;
    } catch (error) {
      console.error('❌ Failed to join voice channel:', error);
      return false;
    }
  }

  /**
   * Make Starfire leave voice channel
   */
  leaveChannel(guildId) {
    const connection = this.connections.get(guildId);
    if (connection) {
      connection.destroy();
      this.connections.delete(guildId);
      this.players.delete(guildId);
      this.isListening.delete(guildId);
      console.log(`✅ Starfire left voice channel in guild ${guildId}`);
      return true;
    }
    return false;
  }

  /**
   * Convert text to speech and play in voice channel
   */
  async speak(guildId, text, voiceSettings = {}) {
    try {
      const player = this.players.get(guildId);
      if (!player) {
        console.log('❌ No voice connection found for guild:', guildId);
        return false;
      }

      // Configure TTS request
      const request = {
        input: { text: text },
        voice: {
          languageCode: voiceSettings.languageCode || 'en-US',
          name: voiceSettings.voiceName || 'en-US-Neural2-F', // Female voice
          ssmlGender: voiceSettings.gender || 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: voiceSettings.speakingRate || 1.0,
          pitch: voiceSettings.pitch || 0.0,
          volumeGainDb: voiceSettings.volume || 0.0
        }
      };

      // Generate speech
      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      // Save audio to temporary file
      const audioPath = path.join(this.audioDir, `tts_${Date.now()}.mp3`);
      fs.writeFileSync(audioPath, response.audioContent, 'binary');
      
      // Create audio resource and play
      const resource = createAudioResource(audioPath);
      player.play(resource);
      
      // Clean up file after playing
      player.once(AudioPlayerStatus.Idle, () => {
        try {
          fs.unlinkSync(audioPath);
        } catch (e) {
          console.log('Failed to delete temp audio file:', e.message);
        }
      });
      
      console.log(`🔊 Starfire speaking: "${text.slice(0, 50)}..."`);
      return true;
    } catch (error) {
      console.error('❌ TTS Error:', error);
      return false;
    }
  }

  /**
   * Start listening for voice input from users
   */
  startListening(guildId, targetUserId = null) {
    const connection = this.connections.get(guildId);
    if (!connection) return;

    this.isListening.set(guildId, true);
    console.log(`👂 Started listening for voice input in guild ${guildId}`);

    // Listen to voice data from the connection
    connection.receiver.speaking.on('start', (userId) => {
      if (targetUserId && userId !== targetUserId) return; // Only listen to specific user if specified
      if (userId === this.client.user.id) return; // Don't listen to ourselves
      
      console.log(`🎤 User ${userId} started speaking`);
      this.handleVoiceInput(guildId, userId);
    });
  }

  /**
   * Handle incoming voice input and convert to text
   */
  async handleVoiceInput(guildId, userId) {
    try {
      const connection = this.connections.get(guildId);
      if (!connection) return;

      // Get audio stream from user
      const audioStream = connection.receiver.subscribe(userId, {
        end: {
          behavior: 'afterSilence',
          duration: 1000, // 1 second of silence ends recording
        },
      });

      // Save audio data to buffer
      const chunks = [];
      audioStream.on('data', chunk => chunks.push(chunk));
      
      audioStream.on('end', async () => {
        if (chunks.length === 0) return;
        
        const audioBuffer = Buffer.concat(chunks);
        
        // Convert to text using Google Speech-to-Text
        const text = await this.speechToText(audioBuffer);
        if (text && text.trim()) {
          console.log(`📝 Transcribed: "${text}"`);
          
          // Process the text with Starfire AI
          await this.processVoiceCommand(guildId, userId, text);
        }
      });

    } catch (error) {
      console.error('❌ Voice input error:', error);
    }
  }

  /**
   * Convert speech audio to text
   */
  async speechToText(audioBuffer) {
    try {
      const request = {
        audio: {
          content: audioBuffer.toString('base64')
        },
        config: {
          encoding: 'WEBM_OPUS', // Discord uses OPUS
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
          model: 'latest_long'
        }
      };

      const [response] = await this.sttClient.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
      
      return transcription;
    } catch (error) {
      console.error('❌ STT Error:', error);
      return null;
    }
  }

  /**
   * Process voice command with AI and respond
   */
  async processVoiceCommand(guildId, userId, text) {
    try {
      // Import the AI response function from your bot
      const { getTextResponse } = require('../ai/gemini');
      
      // Get AI response (you'll need to adapt this to your existing AI system)
      const aiResponse = await getTextResponse(text, userId, {
        isVoiceMode: true,
        keepShort: true // Voice responses should be shorter
      });

      if (aiResponse) {
        // Speak the AI response
        await this.speak(guildId, aiResponse, {
          voiceName: 'en-US-Neural2-F', // Starfire's voice
          speakingRate: 1.1, // Slightly faster
          pitch: 2.0 // Higher pitch for more personality
        });
      }
    } catch (error) {
      console.error('❌ Voice command processing error:', error);
      await this.speak(guildId, "Sorry, I had trouble processing that. Could you try again?");
    }
  }

  /**
   * Stop listening in a guild
   */
  stopListening(guildId) {
    this.isListening.set(guildId, false);
    console.log(`🔇 Stopped listening in guild ${guildId}`);
  }

  /**
   * Check if connected to voice in a guild
   */
  isConnected(guildId) {
    const connection = this.connections.get(guildId);
    return connection && connection.state.status === VoiceConnectionStatus.Ready;
  }

  /**
   * Get voice connection info
   */
  getConnectionInfo(guildId) {
    const connection = this.connections.get(guildId);
    if (!connection) return null;
    
    return {
      status: connection.state.status,
      channelId: connection.joinConfig.channelId,
      isListening: this.isListening.get(guildId) || false
    };
  }
}

module.exports = VoiceManager;

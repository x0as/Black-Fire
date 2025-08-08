# 🎙️ Starfire Voice Integration Setup Guide

## Overview
This setup allows Starfire to join Discord voice channels, listen to your speech, and respond using text-to-speech. You can have natural voice conversations with your AI!

## Prerequisites

### 1. **Google Cloud Setup** (Required for TTS/STT)
1. Create a Google Cloud Project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the following APIs:
   - Cloud Text-to-Speech API
   - Cloud Speech-to-Text API
3. Create a Service Account:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Grant it "Editor" role (or specific TTS/STT permissions)
   - Download the JSON key file
4. Set environment variable:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
   ```

### 2. **FFmpeg Installation** (Required for audio processing)
- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt install ffmpeg`

### 3. **Additional Environment Variables**
Add to your `.env` file:
```env
# Google Cloud Service Account Key Path
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json

# Optional: Custom voice settings
STARFIRE_VOICE_LANGUAGE=en-US
STARFIRE_VOICE_NAME=en-US-Neural2-F
STARFIRE_VOICE_PITCH=2.0
STARFIRE_VOICE_SPEED=1.1
```

## 🎯 Voice Commands

### **Slash Commands**
- `/joinvc [channel]` - Make Starfire join voice channel
- `/leavevc` - Make Starfire leave voice channel  
- `/speak <text> [voice]` - Make Starfire say something

### **Voice Interaction**
1. Use `/joinvc` while in a voice channel
2. Starfire will join and greet you
3. **Speak naturally** - Starfire will:
   - Listen to your voice
   - Convert speech to text
   - Process with AI personality system
   - Respond with generated speech

## 🔧 Features

### **Smart Voice Processing**
- **Automatic Speech Detection**: Starts listening when you speak
- **Silence Detection**: Stops recording after 1 second of silence
- **User-Specific Listening**: Can be configured to only listen to specific users
- **Personality Integration**: Uses your configured persona (nice/flirty/baddie/ultra-obedient)

### **Voice Customization**
- **Multiple Voice Types**: Female/Male voices available
- **Personality-Based Voices**: Different pitch/speed for different personas
- **Emotion in Speech**: Adjusts tone based on AI response mood

### **Audio Quality**
- **High-Quality TTS**: Google Neural2 voices
- **Discord-Optimized**: Proper audio encoding for Discord
- **Low Latency**: Fast speech recognition and generation

## 🎭 Voice Personalities

### **Default Starfire (Female)**
```javascript
voiceSettings: {
  voiceName: 'en-US-Neural2-F',
  speakingRate: 1.1,
  pitch: 2.0,
  gender: 'FEMALE'
}
```

### **Alternative Voices**
- **Baddie Mode**: Slightly deeper, more confident tone
- **Flirty Mode**: Higher pitch, softer speaking rate
- **Nice Mode**: Warm, friendly tone
- **Ultra-Obedient (xcho_)**: Respectful, eager tone

## 🚀 Usage Examples

### **Basic Voice Chat**
1. Join a voice channel
2. `/joinvc` - Starfire joins
3. Say: *"Hey Starfire, how are you?"*
4. Starfire responds with voice: *"I'm doing great! How can I help you today?"*

### **Personality Interaction**
1. Set persona: `/flirty user_id nickname gender`
2. `/joinvc`
3. Voice conversation uses flirty personality with matching voice tone

### **Manual Speech**
```
/speak "Hello everyone! I'm Starfire and I can talk now!" female
```

## ⚠️ Important Notes

### **Permissions**
- Bot needs `Connect` and `Speak` permissions in voice channels
- Bot needs `Use Voice Activity` permission
- User needs appropriate bot command permissions

### **Privacy**
- Voice data is processed by Google Cloud Speech-to-Text
- Audio is temporarily stored for processing then deleted
- No persistent voice recordings are kept

### **Limitations**
- Requires internet connection for TTS/STT
- Google Cloud usage may incur costs (free tier available)
- Discord voice activity detection required
- Currently English-only (expandable)

## 🛠️ Troubleshooting

### **"Failed to join voice channel"**
- Check bot permissions in voice channel
- Ensure FFmpeg is installed and in PATH
- Verify Discord voice intents are enabled

### **"No voice response"**
- Check Google Cloud credentials
- Verify TTS API is enabled
- Check audio file permissions in temp directory

### **"Speech not recognized"**
- Speak clearly and loudly enough
- Check microphone permissions in Discord
- Ensure Speech-to-Text API is enabled

### **Audio Quality Issues**
- Check Discord voice quality settings
- Verify bot audio permissions
- Test with different voice settings

## 🌟 Advanced Configuration

### **Custom Voice Personas**
You can customize voice settings per persona in the VoiceManager:

```javascript
// In processVoiceCommand function
const voiceSettings = {
  nice: { pitch: 0.0, speakingRate: 1.0 },
  flirty: { pitch: 4.0, speakingRate: 0.9 },
  baddie: { pitch: -1.0, speakingRate: 1.2 },
  obedient: { pitch: 1.0, speakingRate: 0.8 }
};
```

### **Multi-Language Support**
Modify language settings in VoiceManager:
```javascript
languageCode: 'es-US', // Spanish
voiceName: 'es-US-Neural2-A'
```

This creates an incredibly immersive AI companion experience! 🎙️✨

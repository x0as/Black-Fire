# 🎤 Black-Fire Discord Bot - Voice Features

A powerful Discord bot with AI personality system and voice capabilities, designed to bypass UAE Discord restrictions using GitHub Codespaces.

## 🌟 Features

### Core Features
- ✅ Multi-personality AI system (nice, flirty, baddie, ultra-obedient for xcho_)
- ✅ Comprehensive user verification system
- ✅ Supporters channel with automatic role assignment
- ✅ Giveaway system with MongoDB persistence
- ✅ Message tracking and leaderboards

### 🎵 Voice Features (NEW!)
- 🎤 **Join/Leave Voice Channels** - `/vcjoin` and `/vcleave` commands
- 🗣️ **Text-to-Speech** - `/vcsay` to make the bot speak in voice chat
- 🔊 **Cross-platform TTS** - Windows SAPI, Linux espeak/festival
- 🌐 **UAE Bypass** - Works in GitHub Codespaces to bypass Discord restrictions

## 🚀 Quick Start (GitHub Codespaces)

### Method 1: Direct Codespace Creation
1. Go to your [Black-Fire repository](https://github.com/x0as/Black-Fire)
2. Click the green **"Code"** button
3. Select **"Codespaces"** tab
4. Click **"Create codespace on main"**
5. Wait for the environment to set up automatically

### Method 2: Manual Setup
```bash
# The setup script will run automatically, but if needed:
./scripts/setup-codespaces.sh
```

### Environment Variables
Create a `.env` file in the root directory:
```env
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_client_id
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEYS=your_gemini_api_keys
PORT=3000
```

### Start the Bot
```bash
npm start
```

### Text-to-Speech Setup
If you encounter TTS errors, install dependencies:
```bash
# Run the TTS setup script
npm run setup-tts

# Or manually install espeak (Linux/Mac)
sudo apt install espeak espeak-data  # Ubuntu/Debian
brew install espeak                  # macOS

# Windows uses built-in SAPI (no setup needed)
```

## 🎤 Voice Commands

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/vcjoin [channel]` | Join a voice channel | Admin/Owner/Perms |
| `/vcleave` | Leave current voice channel | Admin/Owner/Perms |
| `/vcsay <text>` | Text-to-speech in voice chat | Admin/Owner/Perms |

### Voice Usage Examples
```
/vcjoin                    # Join your current voice channel
/vcjoin #General Voice     # Join specific voice channel
/vcsay Hello everyone!     # Make bot speak in voice chat
/vcleave                   # Leave voice channel
```

## 🌍 UAE Discord Restrictions Bypass

### The Problem
- Discord voice features are blocked in UAE
- Local bot hosting can't connect to Discord voice servers
- VPN solutions are unreliable for bots

### The Solution: GitHub Codespaces
- ✅ Runs on GitHub's global infrastructure (US/EU servers)
- ✅ Bypasses local network restrictions
- ✅ Free tier available (120 hours/month)
- ✅ Full Linux environment with audio support
- ✅ Persistent storage for bot data

### Why This Works
1. **Server Location**: Codespaces run in regions where Discord isn't blocked
2. **Network Freedom**: GitHub's infrastructure has unrestricted internet access
3. **Audio Support**: Linux environment with full audio stack (FFmpeg, espeak, etc.)
4. **Always Online**: Can run 24/7 (within usage limits)

## 🛠️ Technical Details

### Voice Technology Stack
- **Discord.js Voice**: Official Discord voice library
- **FFmpeg**: Audio processing and format conversion
- **Text-to-Speech Engines**:
  - Windows: SAPI (System.Speech.Synthesis)
  - Linux: espeak, festival
- **Audio Encoding**: Opus codec for Discord compatibility

### File Structure
```
src/
├── bot.js              # Main bot file with voice commands
├── utils/
│   └── tts.js          # Text-to-speech utilities
scripts/
└── setup-codespaces.sh # Codespaces setup script
.devcontainer/
└── devcontainer.json   # Codespaces configuration
temp/                   # Temporary TTS audio files
```

### Voice Command Flow
1. User runs `/vcsay "Hello world"`
2. Bot validates permissions and voice connection
3. Text is cleaned (remove mentions, emojis, etc.)
4. TTS engine generates WAV file
5. FFmpeg processes audio for Discord
6. Audio is streamed to voice channel
7. Temporary files are cleaned up

## 🔧 Development

### Local Development (Non-UAE)
```bash
git clone https://github.com/x0as/Black-Fire.git
cd Black-Fire
npm install
# Create .env file
npm start
```

### Adding New Voice Features
1. Add command to `commands` array in `bot.js`
2. Implement handler in voice commands section
3. Test TTS functionality with different text types
4. Ensure proper cleanup of audio files

### TTS Customization
Edit `src/utils/tts.js` to:
- Add new TTS engines
- Modify voice settings
- Change audio quality
- Add voice selection

## 📱 Deployment Options

### Option 1: GitHub Codespaces (Recommended for UAE)
- ✅ Bypasses restrictions
- ✅ Zero local setup
- ✅ Cloud-based
- ❌ Limited free hours

### Option 2: VPS/Cloud Server
- ✅ Full control
- ✅ 24/7 uptime
- ❌ Requires server management
- ❌ May be blocked in UAE

### Option 3: Local Hosting (Not for UAE)
- ✅ Free
- ✅ Full control
- ❌ Blocked in UAE
- ❌ Requires local setup

## 🆘 Troubleshooting

### Voice Issues
```bash
# Check audio system
aplay -l

# Test espeak
espeak "test"

# Check FFmpeg
ffmpeg -version

# Bot logs
npm start 2>&1 | tee bot.log
```

### Common Errors
1. **"Failed to join voice channel"** - Check bot permissions
2. **"TTS generation failed"** - Verify audio dependencies
3. **"No voice connection"** - Run `/vcjoin` first
4. **"Permission denied"** - Check command permissions
5. **"festival: not found"** - Install TTS dependencies with `npm run setup-tts`
6. **"espeak: command not found"** - Run `sudo apt install espeak espeak-data`

### UAE-Specific Issues
1. **Local testing fails** - Expected, use Codespaces
2. **Voice features don't work locally** - Use cloud environment
3. **Connection timeouts** - Switch to Codespaces

## 📞 Support

- **Repository**: [Black-Fire](https://github.com/x0as/Black-Fire)
- **Issues**: Create GitHub issue for bugs
- **Discord**: Test voice features in your server

## 🎯 Future Features

- [ ] AI voice responses (connect Gemini to TTS)
- [ ] Voice activity detection
- [ ] Music playback capabilities
- [ ] Voice message transcription
- [ ] Multi-language TTS support
- [ ] Custom voice profiles
- [ ] Sound effects library

---

**🌟 Enjoy your unrestricted Discord bot with voice features!**

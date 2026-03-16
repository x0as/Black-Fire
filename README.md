```markdown
# 🎤 Black-Fire Discord Bot — AI & Voice Features (40k+ Community)

Black-Fire is a production-oriented Discord bot built **on request for a large Discord community (~40,000 members)**. It focuses on scalable server utilities (verification, roles, tracking), a configurable AI-style response system, and optional voice features (join/leave + text-to-speech) for interactive community experiences.

> This project is intended for legitimate server operations (community automation, moderation support, and engagement features). It does **not** promote or include guidance for bypassing local laws, ISP restrictions, or platform policies.

---

## 🌟 Features

### Core Features
- ✅ **Configurable AI response profiles** (adjustable tone/preset “personalities” suitable for community use)
- ✅ **User verification / onboarding flow** (helpful for large-server moderation)
- ✅ **Supporter / subscriber automation** (role assignment based on configured rules)
- ✅ **Message tracking + leaderboards** (engagement insights for community staff)

### 🎵 Voice Features
- 🎤 **Join/Leave Voice Channels** — `/vcjoin` and `/vcleave`
- 🗣️ **Text-to-Speech (TTS)** — `/vcsay` to speak text in voice chat
- 🔊 **Cross-platform audio pipeline** — works with common OS tools (Windows + Linux/Mac via installed TTS engines)
- 🎧 **Discord voice streaming** using Opus-compatible audio playback

---

## 🚀 Quick Start (Recommended: Dev Container / Codespaces)

This repo includes scripts and configuration that can be used with **GitHub Codespaces** (or any dev container-compatible environment) to standardize setup across machines—helpful when multiple maintainers contribute.

### Method 1: Create a Codespace
1. Open the repository on GitHub
2. Click **Code**
3. Open the **Codespaces** tab
4. Click **Create codespace on main**
5. Wait for the environment to finish initializing

### Method 2: Manual Setup Script
```bash
# The setup script may run automatically in some environments, but you can run it manually:
./scripts/setup-codespaces.sh
```

---

## 🔐 Environment Variables

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

---

## 🎤 Voice Commands

| Command | Description | Typical Permissions |
|---------|-------------|---------------------|
| `/vcjoin [channel]` | Join a voice channel | Admin/Moderator |
| `/vcleave` | Leave current voice channel | Admin/Moderator |
| `/vcsay <text>` | Text-to-speech in voice chat | Admin/Moderator |

### Voice Usage Examples
```text
/vcjoin
/vcjoin #General Voice
/vcsay Hello everyone!
/vcleave
```

---

## 🗣️ Text-to-Speech Setup (Optional)

If you encounter TTS errors, install dependencies:

```bash
# Run the TTS setup script (if included in package scripts)
npm run setup-tts
```

Or install manually:

```bash
# Linux
sudo apt install espeak espeak-data  # Ubuntu/Debian

# macOS
brew install espeak

# Windows: typically uses built-in speech components (no extra setup needed)
```

---

## 🛠️ Technical Details

### Voice Technology Stack
- **Discord.js Voice**: voice connections + audio playback
- **FFmpeg**: audio processing and conversion
- **Text-to-Speech Engines** (depends on OS / installation)
  - Windows: system speech components
  - Linux/macOS: common CLI TTS engines (e.g., `espeak`; others optional)
- **Audio Encoding**: Opus-compatible pipeline for Discord

### File Structure
```text
src/
├── bot.js              # Main bot file with voice commands and core logic
├── utils/
│   └── tts.js          # Text-to-speech utilities
scripts/
└── setup-codespaces.sh # Dev environment setup helper
.devcontainer/
└── devcontainer.json   # Dev container configuration
temp/                   # Temporary TTS audio files (if used)
```

### Voice Command Flow
1. User runs `/vcsay "Hello world"`
2. Bot validates permissions and voice connection
3. Input text is sanitized (e.g., reduce noise from mentions/emojis)
4. TTS engine generates audio
5. FFmpeg prepares audio for streaming
6. Audio is played in the voice channel
7. Temporary files are cleaned up

---

## 🔧 Development

### Local Development
```bash
git clone https://github.com/x0as/Black-Fire.git
cd Black-Fire
npm install
# Create .env file
npm start
```

### Adding New Voice Features
1. Add the command definition where commands are registered
2. Implement the handler logic in the voice commands section
3. Test with various text inputs and edge cases
4. Ensure audio/temp-file cleanup paths are correct

### TTS Customization
Edit `src/utils/tts.js` to:
- add/adjust engines
- tune voice settings
- control output format/quality
- implement voice selection

---

## 📱 Deployment Options

### Option 1: Dev Container / Codespaces (Convenient for Contributors)
- ✅ Consistent environment across machines
- ✅ Fast onboarding for new maintainers
- ❌ Limited free usage (depending on your GitHub plan)

### Option 2: VPS / Cloud Server
- ✅ 24/7 uptime and more control
- ❌ Requires server management and monitoring

### Option 3: Local Hosting
- ✅ Simple and free for small testing
- ❌ Not ideal for always-on production

---

## 🆘 Troubleshooting

### Voice Diagnostics
```bash
# Check audio system (Linux)
aplay -l

# Test espeak (Linux/macOS if installed)
espeak "test"

# Check FFmpeg
ffmpeg -version

# Bot logs
npm start 2>&1 | tee bot.log
```

### Common Errors
1. **"Failed to join voice channel"** — confirm bot permissions + channel permissions
2. **"TTS generation failed"** — install TTS dependencies and verify binary availability
3. **"No voice connection"** — run `/vcjoin` first
4. **"Permission denied"** — check command permission gating and role config
5. **"espeak: command not found"** — install `espeak` and `espeak-data`

---

## 📞 Support

- **Repository**: Black-Fire
- **Issues**: open a GitHub issue for bugs / feature requests
- **Server context**: built for a large community (~40k members), so performance and moderation workflows matter

---

## 🎯 Future Features

- [ ] AI voice responses (optional: connect AI output to TTS)
- [ ] Voice activity detection
- [ ] Music playback capabilities
- [ ] Voice message transcription
- [ ] Multi-language TTS support
- [ ] Custom voice profiles
- [ ] Sound effects library

---

**🌟 Built for large communities — reliable, configurable, and maintainable.**
```

#!/bin/bash

# GitHub Codespaces setup script for Black-Fire Discord Bot
echo "🚀 Setting up Black-Fire Discord Bot environment..."

# Update package list
sudo apt-get update

# Install audio dependencies for Discord voice
echo "📦 Installing audio dependencies..."
sudo apt-get install -y \
    ffmpeg \
    espeak \
    espeak-data \
    libespeak-dev \
    festival \
    alsa-utils \
    libasound2-dev

# Install additional build tools for native modules
sudo apt-get install -y \
    build-essential \
    python3 \
    python3-pip \
    pkg-config

# Set up audio for headless environment
echo "🔊 Configuring audio for headless environment..."
sudo modprobe snd-dummy
echo "snd-dummy" | sudo tee -a /etc/modules

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create temp directory for TTS files
mkdir -p temp

# Set proper permissions
chmod +x scripts/setup-codespaces.sh

echo "✅ Setup complete!"
echo ""
echo "🎤 Voice features are now ready!"
echo "📝 Next steps:"
echo "   1. Create a .env file with your bot credentials"
echo "   2. Add: BOT_TOKEN, CLIENT_ID, MONGO_URI"
echo "   3. Run: npm start"
echo ""
echo "🌐 This environment bypasses UAE Discord restrictions!"

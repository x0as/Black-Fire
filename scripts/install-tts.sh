#!/bin/bash

# Install Text-to-Speech dependencies for Black Fire Discord Bot
# This script installs espeak for Linux systems

echo "🎤 Installing Text-to-Speech dependencies..."

# Check if running on Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "📦 Installing espeak on Linux..."
    
    # Update package list
    sudo apt update
    
    # Install espeak and espeak-data
    sudo apt install -y espeak espeak-data
    
    # Test installation
    if command -v espeak &> /dev/null; then
        echo "✅ espeak installed successfully!"
        espeak "Text to speech is now working" -s 150
    else
        echo "❌ Failed to install espeak"
        exit 1
    fi
    
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📦 Installing espeak on macOS..."
    
    # Check if Homebrew is installed
    if command -v brew &> /dev/null; then
        brew install espeak
        echo "✅ espeak installed successfully!"
    else
        echo "❌ Homebrew not found. Please install Homebrew first: https://brew.sh/"
        exit 1
    fi
    
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    echo "🪟 Windows detected. TTS uses built-in SAPI - no additional installation needed."
    
else
    echo "❓ Unknown operating system: $OSTYPE"
    echo "Please manually install espeak or festival for TTS functionality."
    exit 1
fi

echo "🎉 TTS setup complete!"

import { createAudioResource } from '@discordjs/voice';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Convert text to speech using Windows SAPI (built-in TTS)
 * Falls back to espeak if available on Linux/Mac
 */
export async function textToSpeech(text, outputPath = null) {
  if (!outputPath) {
    outputPath = path.join(process.cwd(), 'temp', `tts_${Date.now()}.wav`);
  }

  // Ensure temp directory exists
  const tempDir = path.dirname(outputPath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Clean text for TTS (remove mentions, emojis, etc.)
    const cleanText = text
      .replace(/<@!?\d+>/g, 'user') // Replace mentions
      .replace(/<#\d+>/g, 'channel') // Replace channel mentions
      .replace(/<@&\d+>/g, 'role') // Replace role mentions
      .replace(/:[a-zA-Z0-9_]+:/g, '') // Remove emoji names
      .replace(/[^\w\s.,!?-]/g, '') // Remove special characters
      .trim();

    if (!cleanText) {
      throw new Error('No valid text to convert to speech');
    }

    // Try Windows SAPI first (most reliable on Windows)
    if (process.platform === 'win32') {
      // Use PowerShell with SAPI to generate TTS
      const psCommand = `
        Add-Type -AssemblyName System.Speech;
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
        $synth.SetOutputToWaveFile('${outputPath.replace(/\\/g, '\\\\')}');
        $synth.Speak('${cleanText.replace(/'/g, "''")}');
        $synth.Dispose();
      `;
      
      await execAsync(`powershell -Command "${psCommand}"`);
    } else {
      // Linux/Mac: Try espeak or festival
      try {
        await execAsync(`espeak "${cleanText}" -w "${outputPath}"`);
      } catch (e) {
        // Fallback to festival
        await execAsync(`echo "${cleanText}" | festival --tts --otype wav > "${outputPath}"`);
      }
    }

    // Verify file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('TTS file was not created');
    }

    return outputPath;
  } catch (error) {
    console.error('Text-to-speech error:', error);
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}

/**
 * Create an audio resource from a file path
 */
export function createTTSResource(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('Audio file does not exist');
  }

  return createAudioResource(filePath, {
    inlineVolume: true
  });
}

/**
 * Clean up temporary TTS files
 */
export function cleanupTTSFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleaned up TTS file: ${filePath}`);
    }
  } catch (error) {
    console.error('Failed to cleanup TTS file:', error);
  }
}

/**
 * Get available voices (Windows only)
 */
export async function getAvailableVoices() {
  if (process.platform !== 'win32') {
    return ['default'];
  }

  try {
    const psCommand = `
      Add-Type -AssemblyName System.Speech;
      $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
      $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name };
      $synth.Dispose();
    `;
    
    const { stdout } = await execAsync(`powershell -Command "${psCommand}"`);
    return stdout.trim().split('\n').filter(voice => voice.trim());
  } catch (error) {
    console.error('Failed to get voices:', error);
    return ['default'];
  }
}

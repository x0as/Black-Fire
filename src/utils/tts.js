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
      // Use PowerShell with SAPI to generate TTS with feminine voice
      const psCommand = `
        Add-Type -AssemblyName System.Speech;
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
        
        # Try to select a female voice
        $femaleVoices = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Gender -eq 'Female' };
        if ($femaleVoices.Count -gt 0) {
          $synth.SelectVoice($femaleVoices[0].VoiceInfo.Name);
        }
        
        # Set natural speech rate (slightly slower)
        $synth.Rate = -1;
        
        $synth.SetOutputToWaveFile('${outputPath.replace(/\\/g, '\\\\')}');
        $synth.Speak('${cleanText.replace(/'/g, "''")}');
        $synth.Dispose();
      `;

      await execAsync(`powershell -Command "${psCommand}"`);
    } else {
      // Linux/Mac: Use espeak with feminine, natural voice settings
      try {
        // Enhanced feminine voice settings:
        // -v en+f4: use female voice variant 4 (more feminine)
        // -s 140: slightly slower speed for more natural speech
        // -p 60: higher pitch for feminine voice (default is 50)
        // -a 100: amplitude/volume
        // -g 10: gap between words for clarity
        // -w: write to file
        await execAsync(`espeak "${cleanText}" -v en+f4 -s 140 -p 60 -a 100 -g 10 -w "${outputPath}"`);
      } catch (e) {
        console.error('espeak with feminine voice failed:', e.message);
        // Try alternative feminine voice
        try {
          await execAsync(`espeak "${cleanText}" -v en+f3 -s 140 -p 58 -a 100 -w "${outputPath}"`);
        } catch (e2) {
          console.error('Alternative feminine voice failed:', e2.message);
          // Fallback to basic feminine settings
          try {
            await execAsync(`echo "${cleanText}" | espeak -v en+f2 -s 140 -p 55 -w "${outputPath}"`);
          } catch (e3) {
            console.error('All feminine voice attempts failed:', e3.message);
            throw new Error(`espeak is not available or failed to generate audio. Please ensure espeak is installed on your system.`);
          }
        }
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
 * Get available voices
 */
export async function getAvailableVoices() {
  try {
    if (process.platform === 'win32') {
      const psCommand = `
        Add-Type -AssemblyName System.Speech;
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
        $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name };
        $synth.Dispose();
      `;

      const { stdout } = await execAsync(`powershell -Command "${psCommand}"`);
      return stdout.trim().split('\n').filter(voice => voice.trim());
    } else {
      // Linux/Mac: Get espeak voices
      try {
        const { stdout } = await execAsync('espeak --voices');
        const voices = stdout.split('\n')
          .filter(line => line.trim() && !line.startsWith('Pty'))
          .map(line => {
            const parts = line.trim().split(/\s+/);
            return parts[4] || parts[1] || 'default'; // Get language name or code
          })
          .filter(voice => voice && voice !== 'default');

        return voices.length > 0 ? voices : ['en', 'en-us'];
      } catch (error) {
        console.error('Failed to get espeak voices:', error);
        return ['en', 'en-us'];
      }
    }
  } catch (error) {
    console.error('Failed to get voices:', error);
    return ['default'];
  }
}
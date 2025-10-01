#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

let botProcess;
let restartCount = 0;
const maxRestarts = 10;

function startBot() {
  console.log(`🚀 Starting bot (attempt ${restartCount + 1})`);
  
  botProcess = spawn('node', ['src/index.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  botProcess.on('exit', (code, signal) => {
    console.log(`\n💀 Bot process exited with code ${code} and signal ${signal}`);
    
    if (restartCount < maxRestarts) {
      restartCount++;
      console.log(`🔄 Restarting bot in 5 seconds... (${restartCount}/${maxRestarts})`);
      setTimeout(startBot, 5000);
    } else {
      console.error('🚨 Max restart attempts reached. Exiting...');
      process.exit(1);
    }
  });

  botProcess.on('error', (error) => {
    console.error('🚨 Failed to start bot process:', error);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM received, shutting down...');
  if (botProcess) {
    botProcess.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📡 SIGINT received, shutting down...');
  if (botProcess) {
    botProcess.kill('SIGINT');
  }
  process.exit(0);
});

console.log('🎯 Bot supervisor started');
startBot();
#!/usr/bin/env node

/**
 * Development startup script for AdMotion
 * This script helps start both frontend and backend services
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting AdMotion Development Environment...\n');

// Start frontend (React + Vite)
console.log('📱 Starting Frontend (React + Vite)...');
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true
});

// Start backend (FastAPI) - if Python is available
console.log('🔧 Starting Backend (FastAPI)...');
const backend = spawn('python', ['main.py'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  frontend.kill('SIGINT');
  backend.kill('SIGINT');
  process.exit(0);
});

// Handle errors
frontend.on('error', (err) => {
  console.error('❌ Frontend error:', err.message);
});

backend.on('error', (err) => {
  console.error('❌ Backend error:', err.message);
  console.log('💡 Make sure Python and FastAPI are installed');
  console.log('   pip install fastapi uvicorn firebase-admin');
});

console.log('\n✅ Development servers started!');
console.log('📱 Frontend: http://localhost:5173');
console.log('🔧 Backend: http://localhost:8000');
console.log('📚 API Docs: http://localhost:8000/docs');
console.log('\nPress Ctrl+C to stop all servers');


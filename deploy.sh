#!/bin/bash

# Calla Game - Production Deployment Script
# Run this on your Raspberry Pi after cloning the repo

set -e  # Exit on error

echo "🎮 Deploying Calla Game..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull

# Install dependencies (including dev deps needed for build)
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Create logs directory if it doesn't exist
mkdir -p logs

# Restart PM2 process
echo "🔄 Restarting PM2 process..."
if pm2 list | grep -q "calla-game"; then
    pm2 restart calla-game
else
    pm2 start ecosystem.config.cjs
    pm2 save
fi

echo "✅ Deployment complete!"
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs calla-game"
echo "🖥️  Monitor: pm2 monit"

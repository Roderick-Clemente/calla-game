# Calla Game - Production Deployment Guide

## Prerequisites

Your Raspberry Pi needs:
- Node.js (v18 or higher)
- npm
- PM2 (process manager)
- Git

## Initial Setup on Raspberry Pi

### 1. Install PM2 globally

```bash
npm install -g pm2
```

### 2. Clone the repository

```bash
cd ~
git clone <your-repo-url> calla-game
cd calla-game
```

### 3. First deployment

```bash
chmod +x deploy.sh
./deploy.sh
```

This will:
- Install dependencies
- Build the React frontend
- Start the game server with PM2
- Configure auto-restart on crashes

### 4. Make PM2 start on system boot

```bash
pm2 startup
# Follow the instructions (it will give you a command to run with sudo)

pm2 save
```

## Configuration

### Environment Variables

Create a `.env` file in the project root (optional):

```bash
NODE_ENV=production
PORT=3001
CORS_ORIGIN=http://yourpi.local  # Optional: restrict CORS to specific domain
```

### Change Port

Edit `ecosystem.config.cjs`:

```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3002  // Change to your desired port
}
```

## Deployment Workflow

### Deploy Updates

```bash
cd ~/calla-game
./deploy.sh
```

### Manual PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs calla-game

# Real-time monitoring
pm2 monit

# Restart
pm2 restart calla-game

# Stop
pm2 stop calla-game

# Delete from PM2
pm2 delete calla-game
```

## Accessing the Game

Once deployed, access at:
- Local network: `http://<pi-ip>:3001`
- If using hostname: `http://<your-hostname>:3001`

## Resource Usage

Expected memory usage: ~150-200MB per game server instance

Monitor with:
```bash
pm2 monit
# or
htop
```

## Troubleshooting

### Game won't start

```bash
# Check PM2 logs
pm2 logs calla-game --lines 50

# Check if port is in use
sudo lsof -i :3001
```

### Out of memory

```bash
# Check current memory
free -h

# PM2 auto-restarts if exceeds 200MB (configured in ecosystem.config.cjs)
```

### Build fails

```bash
# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Next Steps: Add Nginx Reverse Proxy

Once you're ready to serve both Calla and Kings & Quads from port 80:

1. Install nginx: `sudo apt install nginx`
2. Configure reverse proxy (see NGINX.md - to be created)
3. Access both games from clean URLs

## Security Considerations

- Change default port if desired
- Use nginx with SSL/TLS for HTTPS
- Configure firewall: `sudo ufw allow 3001`
- Keep Node.js and dependencies updated

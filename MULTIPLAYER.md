# Calla Game - Multiplayer Setup

## Game Modes

The Calla game now supports two modes:

1. **Local Game** - Play on the same device (hot-seat multiplayer)
2. **Network Multiplayer** - Play online with a friend

## Running Local Mode

Just run the Vite dev server as usual:

```bash
npm run dev
```

Then select "Local Game" from the menu.

## Running Network Multiplayer

Network mode requires both a **game server** and the **Vite dev server**.

### Step 1: Start the Game Server

In one terminal:

```bash
npm run server
```

Or for auto-restart during development:

```bash
npm run server:dev
```

The server will start on port **3001** by default.

### Step 2: Start the Vite Dev Server

In another terminal:

```bash
npm run dev
```

The Vite dev server will start on port **5173** by default.

### Step 3: Play!

1. Open http://localhost:5173 in two different browser windows/tabs
2. Select "Network Multiplayer" in both windows
3. The server will automatically match the two players
4. The game begins!

## Using ngrok for Remote Play

To play with someone not on your local network:

### Step 1: Start both servers (as above)

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

### Step 2: Tunnel the Vite dev server with ngrok

```bash
ngrok http 5173
```

### Step 3: Update NetworkGame.jsx

In `src/components/NetworkGame.jsx`, change the connection URL from:

```javascript
const newSocket = io('http://localhost:3001');
```

To your server's address. If both are local, you can use:

```javascript
const newSocket = io('http://localhost:3001');
```

Or tunnel both if playing remotely!

## Architecture

- **server.js** - Node.js + Express + Socket.IO game server
  - Handles matchmaking
  - Validates all moves
  - Broadcasts game state to both players

- **LocalGame.jsx** - Single-device multiplayer
  - All game logic runs client-side
  - Players take turns on same device

- **NetworkGame.jsx** - Online multiplayer
  - Connects to game server via Socket.IO
  - Sends move requests to server
  - Receives game state updates

- **App.jsx** - Main app with mode selection menu

## Ports

- **3001** - Game server (Socket.IO)
- **5173** - Vite dev server (React app)

Make sure both ports are available!

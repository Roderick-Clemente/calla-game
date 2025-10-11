const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Allow Vite dev server
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Serve static files from dist directory (Vite build output)
app.use(express.static(path.join(__dirname, 'dist')));

// Game state
const games = new Map(); // gameId -> game state
const players = new Map(); // socketId -> player info
const waitingPlayers = []; // Queue for matchmaking

/**
 * Calla Game Server-side Logic
 * Manages game state and validates moves for multiplayer games
 */
class CallaGame {
    constructor(gameId, player1Id, player2Id) {
        this.gameId = gameId;
        this.player1Id = player1Id;
        this.player2Id = player2Id;

        // Initialize game state
        this.board = {
            playerA: [3, 3, 4, 3, 3],
            playerB: [3, 3, 4, 3, 3],
            callaA: 0,
            callaB: 0
        };

        this.currentPlayer = 'A'; // A or B
        this.gameOver = false;
        this.winner = null;
    }

    /**
     * Get next position counter-clockwise for cube distribution
     */
    getNextPosition(currentPos, isPlayerA) {
        const { side, index, isCalla } = currentPos;

        if (side === 'A') {
            if (index < 4) {
                return { side: 'A', index: index + 1, isCalla: false };
            } else {
                if (isPlayerA) {
                    return { side: 'callaA', index: null, isCalla: true };
                } else {
                    return { side: 'B', index: 0, isCalla: false };
                }
            }
        } else if (side === 'callaA') {
            return { side: 'B', index: 0, isCalla: false };
        } else if (side === 'B') {
            if (index < 4) {
                return { side: 'B', index: index + 1, isCalla: false };
            } else {
                if (!isPlayerA) {
                    return { side: 'callaB', index: null, isCalla: true };
                } else {
                    return { side: 'A', index: 0, isCalla: false };
                }
            }
        } else if (side === 'callaB') {
            return { side: 'A', index: 0, isCalla: false };
        }

        return null;
    }

    /**
     * Validates and executes a move
     */
    makeMove(pitIndex) {
        const currentPits = this.currentPlayer === 'A' ? this.board.playerA : this.board.playerB;

        // Validate: pit must have cubes
        if (currentPits[pitIndex] === 0) {
            return { success: false, error: 'Pit is empty' };
        }

        // Pick up cubes
        let cubes = currentPits[pitIndex];
        if (this.currentPlayer === 'A') {
            this.board.playerA[pitIndex] = 0;
        } else {
            this.board.playerB[pitIndex] = 0;
        }

        // Distribute cubes counter-clockwise
        let currentPos = { side: this.currentPlayer, index: pitIndex, isCalla: false };
        let lastPos = null;
        const isPlayerA = this.currentPlayer === 'A';

        while (cubes > 0) {
            currentPos = this.getNextPosition(currentPos, isPlayerA);

            if (currentPos.isCalla) {
                if (currentPos.side === 'callaA') {
                    this.board.callaA++;
                } else {
                    this.board.callaB++;
                }
            } else {
                if (currentPos.side === 'A') {
                    this.board.playerA[currentPos.index]++;
                } else {
                    this.board.playerB[currentPos.index]++;
                }
            }

            cubes--;
            lastPos = currentPos;
        }

        // Check for special rules
        let freeTurn = false;

        // Free turn: last cube lands in own Calla
        if (lastPos.isCalla) {
            if ((isPlayerA && lastPos.side === 'callaA') || (!isPlayerA && lastPos.side === 'callaB')) {
                freeTurn = true;
            }
        }

        // Capture: last cube lands in own empty pit
        if (!lastPos.isCalla && lastPos.side === this.currentPlayer) {
            const pitCubes = lastPos.side === 'A' ? this.board.playerA[lastPos.index] : this.board.playerB[lastPos.index];

            if (pitCubes === 1) {
                const oppositePitIdx = 4 - lastPos.index;
                const oppositeSide = this.currentPlayer === 'A' ? 'B' : 'A';
                const oppositeCubes = oppositeSide === 'A' ? this.board.playerA[oppositePitIdx] : this.board.playerB[oppositePitIdx];

                if (oppositeCubes > 0) {
                    if (this.currentPlayer === 'A') {
                        this.board.callaA += oppositeCubes;
                        this.board.playerB[oppositePitIdx] = 0;
                    } else {
                        this.board.callaB += oppositeCubes;
                        this.board.playerA[oppositePitIdx] = 0;
                    }
                }
            }
        }

        // Switch turns if not a free turn
        if (!freeTurn) {
            this.currentPlayer = this.currentPlayer === 'A' ? 'B' : 'A';
        }

        // Check game end conditions
        this.checkGameEnd();

        return {
            success: true,
            board: this.board,
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            winner: this.winner,
            freeTurn: freeTurn
        };
    }

    /**
     * Check if game has ended
     */
    checkGameEnd() {
        // Check for instant win (17+ cubes)
        if (this.board.callaA >= 17) {
            this.gameOver = true;
            this.winner = 'A';
            return;
        }
        if (this.board.callaB >= 17) {
            this.gameOver = true;
            this.winner = 'B';
            return;
        }

        // Check if either player has no cubes left
        const playerAHasMoves = this.board.playerA.some(cubes => cubes > 0);
        const playerBHasMoves = this.board.playerB.some(cubes => cubes > 0);

        if (!playerAHasMoves || !playerBHasMoves) {
            this.gameOver = true;
            const scoreA = this.board.callaA;
            const scoreB = this.board.callaB;

            if (scoreA > scoreB) {
                this.winner = 'A';
            } else if (scoreB > scoreA) {
                this.winner = 'B';
            } else {
                this.winner = 'tie';
            }
        }
    }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('findGame', () => {
        console.log('Player looking for game:', socket.id);

        if (waitingPlayers.length > 0) {
            // Match with waiting player
            const opponent = waitingPlayers.shift();
            const gameId = `game_${Date.now()}`;

            // Create new game
            const game = new CallaGame(gameId, socket.id, opponent.id);
            games.set(gameId, game);

            // Store player info
            players.set(socket.id, {
                gameId,
                playerLetter: 'A',
                opponentId: opponent.id
            });
            players.set(opponent.id, {
                gameId,
                playerLetter: 'B',
                opponentId: socket.id
            });

            // Join both players to game room
            socket.join(gameId);
            opponent.socket.join(gameId);

            // Notify both players
            socket.emit('gameStart', {
                gameId,
                playerLetter: 'A',
                board: game.board,
                currentPlayer: game.currentPlayer
            });
            opponent.socket.emit('gameStart', {
                gameId,
                playerLetter: 'B',
                board: game.board,
                currentPlayer: game.currentPlayer
            });

            console.log('Game started:', gameId);
        } else {
            // Add to waiting queue
            waitingPlayers.push({ id: socket.id, socket });
            socket.emit('waiting');
            console.log('Player added to queue:', socket.id);
        }
    });

    socket.on('makeMove', (data) => {
        const player = players.get(socket.id);
        if (!player) return;

        const game = games.get(player.gameId);
        if (!game) return;

        // Verify it's the player's turn
        if (game.currentPlayer !== player.playerLetter) {
            socket.emit('error', { message: 'Not your turn' });
            return;
        }

        const { pitIndex } = data;
        const result = game.makeMove(pitIndex);

        if (result.success) {
            // Broadcast move to both players
            io.to(player.gameId).emit('gameUpdate', result);

            if (result.gameOver) {
                io.to(player.gameId).emit('gameOver', {
                    winner: result.winner,
                    finalBoard: result.board
                });
            }
        } else {
            socket.emit('error', { message: result.error });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        // Remove from waiting queue
        const waitingIndex = waitingPlayers.findIndex(p => p.id === socket.id);
        if (waitingIndex !== -1) {
            waitingPlayers.splice(waitingIndex, 1);
        }

        // Handle game disconnect
        const player = players.get(socket.id);
        if (player) {
            const game = games.get(player.gameId);
            if (game) {
                // Notify opponent
                const opponentId = player.opponentId;
                io.to(opponentId).emit('opponentDisconnected');

                // Clean up
                games.delete(player.gameId);
                players.delete(socket.id);
                players.delete(opponentId);
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Calla game server running on port ${PORT}`);
});

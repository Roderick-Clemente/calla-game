import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import GameInfo from './GameInfo';
import Board from './Board';

/**
 * NetworkGame - Online multiplayer via Socket.IO
 * Players connect to a server and play against each other
 */
function NetworkGame({ onBackToMenu }) {
  const [socket, setSocket] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [playerLetter, setPlayerLetter] = useState(null); // 'A' or 'B'
  const [statusText, setStatusText] = useState('Connecting to server...');
  const [gameStarted, setGameStarted] = useState(false);
  const hasConnected = useRef(false); // Prevent double connection in Strict Mode
  const playerLetterRef = useRef(null); // Ref to access playerLetter in event handlers

  // Game state
  const [board, setBoard] = useState({
    playerA: [3, 3, 4, 3, 3],
    playerB: [3, 3, 4, 3, 3],
    callaA: 0,
    callaB: 0
  });

  const [currentPlayer, setCurrentPlayer] = useState('A');
  const [message, setMessage] = useState('Waiting for game to start...');
  const [gameOver, setGameOver] = useState(false);

  // Connect to server on mount
  useEffect(() => {
    // Prevent double connection in React Strict Mode
    if (hasConnected.current) return;
    hasConnected.current = true;
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setStatusText('Looking for opponent...');
      newSocket.emit('findGame');
    });

    newSocket.on('waiting', () => {
      setStatusText('Waiting for opponent to join...');
    });

    newSocket.on('gameStart', (data) => {
      console.log('Game started:', data);
      setGameId(data.gameId);
      setPlayerLetter(data.playerLetter);
      playerLetterRef.current = data.playerLetter; // Store in ref for event handlers
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setGameStarted(true);

      const myTurn = data.currentPlayer === data.playerLetter;
      setMessage(myTurn ?
        'Your turn! Select a pit to pick up cubes' :
        "Opponent's turn..."
      );
    });

    newSocket.on('gameUpdate', (data) => {
      console.log('Game update:', data);
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);

      if (data.gameOver) {
        setGameOver(true);
        return;
      }

      // Update message based on whose turn it is (use ref to get current playerLetter)
      setMessage(data.currentPlayer === playerLetterRef.current ?
        (data.freeTurn ? 'Free turn! Select a pit' : 'Your turn! Select a pit') :
        "Opponent's turn..."
      );
    });

    newSocket.on('gameOver', (data) => {
      console.log('Game over:', data);
      setGameOver(true);
      const youWon = data.winner === playerLetter;
      const playerNum = playerLetter === 'A' ? '1' : '2';
      const opponentNum = playerLetter === 'A' ? '2' : '1';

      if (data.winner === 'tie') {
        setMessage(`Game Over! It's a tie!`);
      } else if (youWon) {
        setMessage(`Game Over! You (Player ${playerNum}) win!`);
      } else {
        setMessage(`Game Over! Player ${opponentNum} wins!`);
      }
    });

    newSocket.on('opponentDisconnected', () => {
      alert('Opponent disconnected. You win!');
      onBackToMenu();
    });

    newSocket.on('error', (data) => {
      console.error('Server error:', data.message);
      setMessage(`Error: ${data.message}`);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      if (gameStarted) {
        alert('Connection lost');
        onBackToMenu();
      }
    });

    // Cleanup on unmount
    return () => {
      hasConnected.current = false; // Reset for potential remount
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Handle pit click
  const handlePitClick = (pitIndex) => {
    if (!socket || gameOver || currentPlayer !== playerLetter) return;

    const currentPits = currentPlayer === 'A' ? board.playerA : board.playerB;

    if (currentPits[pitIndex] === 0) return;

    // Send move to server
    socket.emit('makeMove', { pitIndex });
  };

  const isMyTurn = currentPlayer === playerLetter;
  const playerNum = playerLetter === 'A' ? '1' : '2';

  // Show waiting screen if game hasn't started
  if (!gameStarted) {
    return (
      <div className="game-screen">
        <div className="menu-content">
          <h2>Network Multiplayer</h2>
          <p className="status-text">{statusText}</p>
          <button className="new-game-btn" onClick={onBackToMenu}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-screen">
      <div className="network-info">
        <div className="player-indicator">
          You are: Player {playerNum} {playerLetter === 'A' ? '(Top)' : '(Bottom)'}
        </div>
        <button className="back-btn" onClick={onBackToMenu}>
          Back to Menu
        </button>
      </div>

      <GameInfo
        message={message}
        autoMove={false}
        onAutoMoveChange={() => {}}
        learningMode={false}
        onLearningModeChange={() => {}}
        onReset={() => {}}
        onUndoPickup={() => {}}
        canUndo={false}
        hideControls={true} // Hide controls in network mode
      />

      <Board
        board={board}
        currentPlayer={currentPlayer}
        gameOver={gameOver}
        cubesInHand={0}
        isHighlighted={() => false}
        handlePitClick={handlePitClick}
        handlePlaceCube={() => {}}
        isNetworkMode={true}
        isMyTurn={isMyTurn}
      />

      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <h2>Game Over!</h2>
            <p>{message}</p>
            <button onClick={onBackToMenu}>Back to Menu</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NetworkGame;

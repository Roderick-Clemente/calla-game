import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import GameInfo from './GameInfo';
import Board from './Board';

/**
 * NetworkGame - Online multiplayer via Socket.IO
 * Players connect to a server and play against each other
 */
function NetworkGame({ onBackToMenu, settings }) {
  const [socket, setSocket] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [playerLetter, setPlayerLetter] = useState(null); // 'A' or 'B'
  const [statusText, setStatusText] = useState('Connecting to server...');
  const [gameStarted, setGameStarted] = useState(false);
  const hasConnected = useRef(false); // Prevent double connection in Strict Mode
  const playerLetterRef = useRef(null); // Ref to access playerLetter in event handlers

  // Extract settings
  const [autoMove, setAutoMove] = useState(settings?.autoMove ?? false);
  const learningMode = settings?.learningMode ?? false; // Learning mode locked (set before matchmaking)

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

  // Manual move state (for non-auto mode)
  const [cubesInHand, setCubesInHand] = useState(0);
  const [nextHighlight, setNextHighlight] = useState(null);
  const [originalPickup, setOriginalPickup] = useState(null);
  const [cubesPlaced, setCubesPlaced] = useState(0);
  const [moveSentToServer, setMoveSentToServer] = useState(false);
  const [queuedUpdate, setQueuedUpdate] = useState(null);
  const cubesInHandRef = useRef(0); // Ref to check cubesInHand in event handlers

  // Helper to update both cubesInHand state and ref
  const updateCubesInHand = (value) => {
    setCubesInHand(value);
    cubesInHandRef.current = value;
  };

  // Calculate next position counter-clockwise (for manual moves)
  const getNextPosition = (currentPos, isPlayerA) => {
    if (!currentPos) return null;

    const { side, index } = currentPos;

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
  };

  // Connect to server on mount
  useEffect(() => {
    // Prevent double connection in React Strict Mode
    if (hasConnected.current) return;
    hasConnected.current = true;

    // Use window.location.origin to connect to the same server that served the page
    // In development: Vite dev server is on 5173, game server is on 3001
    // In production: Both are served from the same port (game server serves built files)
    const serverUrl = import.meta.env.DEV
      ? 'http://localhost:3001'  // Development: explicitly connect to game server
      : window.location.origin;   // Production: use same origin (ngrok or deployed URL)

    console.log('Connecting to Socket.IO server:', serverUrl);
    const newSocket = io(serverUrl);
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
      console.log('Game update:', data, 'cubesInHandRef:', cubesInHandRef.current);

      // If we're currently placing cubes manually, queue this update
      // Use ref to get current value (avoid stale closure)
      if (cubesInHandRef.current > 0) {
        console.log('Queueing update while placing cubes manually');
        setQueuedUpdate(data);
        return;
      }

      // Apply the update immediately
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);

      // Reset manual move state
      updateCubesInHand(0);
      setNextHighlight(null);
      setOriginalPickup(null);
      setCubesPlaced(0);
      setMoveSentToServer(false);

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
    if (!socket || gameOver || currentPlayer !== playerLetter || cubesInHand > 0) return;

    const currentPits = currentPlayer === 'A' ? board.playerA : board.playerB;

    if (currentPits[pitIndex] === 0) return;

    // If auto-move is enabled, send immediately to server
    if (autoMove) {
      socket.emit('makeMove', { pitIndex });
      return;
    }

    // Manual mode: pick up cubes locally (don't send to server yet)
    const cubes = currentPits[pitIndex];

    // Store original pickup for undo (deep copy the board)
    setOriginalPickup({
      player: currentPlayer,
      pitIndex,
      cubes,
      board: {
        playerA: [...board.playerA],
        playerB: [...board.playerB],
        callaA: board.callaA,
        callaB: board.callaB
      }
    });

    // Deep copy the board to avoid mutation
    const newBoard = {
      playerA: [...board.playerA],
      playerB: [...board.playerB],
      callaA: board.callaA,
      callaB: board.callaB
    };

    // Remove cubes from pit
    if (currentPlayer === 'A') {
      newBoard.playerA[pitIndex] = 0;
    } else {
      newBoard.playerB[pitIndex] = 0;
    }

    setBoard(newBoard);
    updateCubesInHand(cubes);
    setCubesPlaced(0);
    setMoveSentToServer(false);

    // Calculate first highlight position
    const isPlayerA = currentPlayer === 'A';
    const firstPos = getNextPosition({ side: currentPlayer, index: pitIndex }, isPlayerA);
    setNextHighlight(firstPos);

    setMessage(`Click highlighted pit to place cube (${cubes} remaining)`);
  };

  // Handle placing a cube (manual mode)
  const handlePlaceCube = () => {
    if (cubesInHand === 0 || !nextHighlight) return;

    // On first cube placed, send the move to server
    if (cubesPlaced === 0 && !moveSentToServer) {
      console.log('First cube placed - sending move to server');
      socket.emit('makeMove', { pitIndex: originalPickup.pitIndex });
      setMoveSentToServer(true);
      setOriginalPickup(null); // Can't undo after first placement
    }

    // Deep copy the board to avoid mutation
    const newBoard = {
      playerA: [...board.playerA],
      playerB: [...board.playerB],
      callaA: board.callaA,
      callaB: board.callaB
    };
    const isPlayerA = currentPlayer === 'A';

    // Place cube at current highlight position
    if (nextHighlight.isCalla) {
      if (nextHighlight.side === 'callaA') {
        newBoard.callaA++;
      } else {
        newBoard.callaB++;
      }
    } else {
      if (nextHighlight.side === 'A') {
        newBoard.playerA[nextHighlight.index]++;
      } else {
        newBoard.playerB[nextHighlight.index]++;
      }
    }

    setBoard(newBoard);
    const remainingCubes = cubesInHand - 1;
    updateCubesInHand(remainingCubes);
    setCubesPlaced(cubesPlaced + 1);

    if (remainingCubes > 0) {
      // Calculate next highlight
      const nextPos = getNextPosition(nextHighlight, isPlayerA);
      setNextHighlight(nextPos);
      setMessage(`Click highlighted pit to place cube (${remainingCubes} remaining)`);
    } else {
      // All cubes placed - check if there's a queued update
      setNextHighlight(null);
      if (queuedUpdate) {
        console.log('Applying queued update');
        setBoard(queuedUpdate.board);
        setCurrentPlayer(queuedUpdate.currentPlayer);
        updateCubesInHand(0);
        setOriginalPickup(null);
        setCubesPlaced(0);
        setMoveSentToServer(false);
        setQueuedUpdate(null);

        if (queuedUpdate.gameOver) {
          setGameOver(true);
        } else {
          setMessage(queuedUpdate.currentPlayer === playerLetterRef.current ?
            (queuedUpdate.freeTurn ? 'Free turn! Select a pit' : 'Your turn! Select a pit') :
            "Opponent's turn..."
          );
        }
      } else {
        setMessage("Opponent's turn...");
      }
    }
  };

  // Undo pickup (learning mode only, before first cube is placed)
  const handleUndoPickup = () => {
    if (!learningMode || !originalPickup || cubesPlaced > 0) return;

    // Restore original board state
    setBoard(originalPickup.board);
    updateCubesInHand(0);
    setNextHighlight(null);
    setOriginalPickup(null);
    setCubesPlaced(0);
    setMoveSentToServer(false);
    setMessage(`Player ${currentPlayer === 'A' ? '1' : '2'}: Select a pit to pick up cubes`);
  };

  // Helper for highlighting
  const isHighlighted = (side, index, isCalla = false) => {
    if (!nextHighlight) return false;
    if (isCalla) {
      return nextHighlight.isCalla && nextHighlight.side === side;
    }
    return !nextHighlight.isCalla && nextHighlight.side === side && nextHighlight.index === index;
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
          You are: Player {playerNum} {playerLetter === 'A' ? '(Bottom)' : '(Top)'}
        </div>
        <button className="back-btn" onClick={onBackToMenu}>
          Back to Menu
        </button>
      </div>

      <GameInfo
        message={message}
        autoMove={autoMove}
        onAutoMoveChange={setAutoMove} // Auto-move is toggleable
        learningMode={learningMode}
        onLearningModeChange={() => {}} // Learning mode locked (set before matchmaking)
        onReset={() => {}} // No reset in network mode
        onUndoPickup={handleUndoPickup}
        canUndo={learningMode && originalPickup !== null && cubesPlaced === 0}
        hideControls={false} // Show controls
        isNetworkMode={true} // Lock learning mode, hide new game button
      />

      <Board
        board={board}
        currentPlayer={currentPlayer}
        gameOver={gameOver}
        cubesInHand={cubesInHand}
        isHighlighted={isHighlighted}
        handlePitClick={handlePitClick}
        handlePlaceCube={handlePlaceCube}
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

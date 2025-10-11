import { useState } from 'react';
import GameInfo from './GameInfo';
import Board from './Board';

/**
 * LocalGame - Single device multiplayer
 * Players take turns on the same device
 */
function LocalGame({ onBackToMenu }) {
  // Initialize game state
  const [board, setBoard] = useState({
    playerA: [3, 3, 4, 3, 3],
    playerB: [3, 3, 4, 3, 3],
    callaA: 0,
    callaB: 0
  });

  const [currentPlayer, setCurrentPlayer] = useState('A');
  const [message, setMessage] = useState('Player 1: Select a pit to pick up cubes');
  const [gameOver, setGameOver] = useState(false);
  const [autoMove, setAutoMove] = useState(false);
  const [learningMode, setLearningMode] = useState(false);

  // Manual move state
  const [cubesInHand, setCubesInHand] = useState(0);
  const [nextHighlight, setNextHighlight] = useState(null);
  const [originalPickup, setOriginalPickup] = useState(null);
  const [cubesPlaced, setCubesPlaced] = useState(0);

  // Calculate next position counter-clockwise
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

  // Check for game end conditions
  const checkGameEnd = (currentBoard) => {
    // Check for instant win (17+ cubes)
    if (currentBoard.callaA >= 17) {
      setGameOver(true);
      setMessage(`Game Over! Player 1 wins instantly with ${currentBoard.callaA} cubes!`);
      return true;
    }
    if (currentBoard.callaB >= 17) {
      setGameOver(true);
      setMessage(`Game Over! Player 2 wins instantly with ${currentBoard.callaB} cubes!`);
      return true;
    }

    // Check if either player has no cubes left to move
    const playerAHasMoves = currentBoard.playerA.some(cubes => cubes > 0);
    const playerBHasMoves = currentBoard.playerB.some(cubes => cubes > 0);

    if (!playerAHasMoves || !playerBHasMoves) {
      setGameOver(true);
      const scoreA = currentBoard.callaA;
      const scoreB = currentBoard.callaB;

      const noMovesPlayer = !playerAHasMoves ? 'Player 1' : 'Player 2';

      if (scoreA > scoreB) {
        setMessage(`Game Over! ${noMovesPlayer} ran out of cubes. Player 1 wins with ${scoreA} cubes!`);
      } else if (scoreB > scoreA) {
        setMessage(`Game Over! ${noMovesPlayer} ran out of cubes. Player 2 wins with ${scoreB} cubes!`);
      } else {
        setMessage(`Game Over! ${noMovesPlayer} ran out of cubes. It's a tie with ${scoreA} cubes each!`);
      }
      return true;
    }

    return false;
  };

  // Pick up cubes from a pit
  const handlePickup = (pitIndex) => {
    if (gameOver || cubesInHand > 0) return;

    const currentPits = currentPlayer === 'A' ? board.playerA : board.playerB;

    if (currentPits[pitIndex] === 0) return;

    const newBoard = { ...board };
    const cubes = currentPits[pitIndex];

    if (currentPlayer === 'A') {
      newBoard.playerA[pitIndex] = 0;
    } else {
      newBoard.playerB[pitIndex] = 0;
    }

    setBoard(newBoard);
    setCubesInHand(cubes);
    setOriginalPickup({ player: currentPlayer, pitIndex, cubes });
    setCubesPlaced(0);

    const start = { side: currentPlayer, index: pitIndex, isCalla: false };
    const next = getNextPosition(start, currentPlayer === 'A');
    setNextHighlight(next);

    setMessage(`${cubes} cubes in hand. Click the highlighted pit to place a cube.`);
  };

  // Place a cube in the highlighted position
  const handlePlaceCube = () => {
    if (!nextHighlight || cubesInHand === 0) return;

    const newBoard = { ...board };
    const { side, index, isCalla } = nextHighlight;

    if (isCalla) {
      if (side === 'callaA') {
        newBoard.callaA++;
      } else {
        newBoard.callaB++;
      }
    } else {
      if (side === 'A') {
        newBoard.playerA[index]++;
      } else {
        newBoard.playerB[index]++;
      }
    }

    setBoard(newBoard);
    setCubesPlaced(prev => prev + 1);

    const remainingCubes = cubesInHand - 1;
    setCubesInHand(remainingCubes);

    if (remainingCubes > 0) {
      const next = getNextPosition(nextHighlight, currentPlayer === 'A');
      setNextHighlight(next);
      setMessage(`${remainingCubes} cubes left. Click the highlighted pit.`);
    } else {
      const lastPos = nextHighlight;
      let freeTurn = false;
      let captured = false;

      if (lastPos.isCalla) {
        if ((currentPlayer === 'A' && lastPos.side === 'callaA') ||
            (currentPlayer === 'B' && lastPos.side === 'callaB')) {
          freeTurn = true;
          setMessage(`${currentPlayer === 'A' ? 'Player 1' : 'Player 2'} gets a free turn! Select a pit.`);
        }
      }

      if (!lastPos.isCalla && lastPos.side === currentPlayer) {
        const pitCubes = lastPos.side === 'A' ? newBoard.playerA[lastPos.index] : newBoard.playerB[lastPos.index];

        if (pitCubes === 1) {
          const oppositePitIdx = 4 - lastPos.index;
          const oppositeSide = currentPlayer === 'A' ? 'B' : 'A';
          const oppositeCubes = oppositeSide === 'A' ? newBoard.playerA[oppositePitIdx] : newBoard.playerB[oppositePitIdx];

          if (oppositeCubes > 0) {
            if (currentPlayer === 'A') {
              newBoard.callaA += oppositeCubes;
              newBoard.playerB[oppositePitIdx] = 0;
            } else {
              newBoard.callaB += oppositeCubes;
              newBoard.playerA[oppositePitIdx] = 0;
            }

            setBoard(newBoard);
            captured = true;
            setMessage(`${currentPlayer === 'A' ? 'Player 1' : 'Player 2'} captured ${oppositeCubes} cubes!`);
          }
        }
      }

      setBoard(newBoard);
      setNextHighlight(null);

      if (checkGameEnd(newBoard)) {
        return;
      }

      if (!freeTurn) {
        setTimeout(() => {
          const nextPlayer = currentPlayer === 'A' ? 'B' : 'A';
          setCurrentPlayer(nextPlayer);
          if (!captured) {
            setMessage(`Player ${nextPlayer === 'A' ? '1' : '2'}: Select a pit to pick up cubes`);
          }
        }, 1000);
      }
    }
  };

  // Auto-move function
  const autoDistribute = (pitIndex) => {
    const newBoard = { ...board };
    const isPlayerA = currentPlayer === 'A';

    let cubes = isPlayerA ? newBoard.playerA[pitIndex] : newBoard.playerB[pitIndex];

    if (isPlayerA) {
      newBoard.playerA[pitIndex] = 0;
    } else {
      newBoard.playerB[pitIndex] = 0;
    }

    let currentPos = { side: currentPlayer, index: pitIndex, isCalla: false };
    let lastPos = null;

    while (cubes > 0) {
      currentPos = getNextPosition(currentPos, isPlayerA);

      if (currentPos.isCalla) {
        if (currentPos.side === 'callaA') {
          newBoard.callaA++;
        } else {
          newBoard.callaB++;
        }
      } else {
        if (currentPos.side === 'A') {
          newBoard.playerA[currentPos.index]++;
        } else {
          newBoard.playerB[currentPos.index]++;
        }
      }

      cubes--;
      lastPos = currentPos;
    }

    let freeTurn = false;
    let captured = false;

    if (lastPos.isCalla) {
      if ((isPlayerA && lastPos.side === 'callaA') || (!isPlayerA && lastPos.side === 'callaB')) {
        freeTurn = true;
        setMessage(`${currentPlayer === 'A' ? 'Player 1' : 'Player 2'} gets a free turn!`);
      }
    }

    if (!lastPos.isCalla && lastPos.side === currentPlayer) {
      const pitCubes = lastPos.side === 'A' ? newBoard.playerA[lastPos.index] : newBoard.playerB[lastPos.index];

      if (pitCubes === 1) {
        const oppositePitIdx = 4 - lastPos.index;
        const oppositeSide = currentPlayer === 'A' ? 'B' : 'A';
        const oppositeCubes = oppositeSide === 'A' ? newBoard.playerA[oppositePitIdx] : newBoard.playerB[oppositePitIdx];

        if (oppositeCubes > 0) {
          if (currentPlayer === 'A') {
            newBoard.callaA += oppositeCubes;
            newBoard.playerB[oppositePitIdx] = 0;
          } else {
            newBoard.callaB += oppositeCubes;
            newBoard.playerA[oppositePitIdx] = 0;
          }

          captured = true;
          setMessage(`${currentPlayer === 'A' ? 'Player 1' : 'Player 2'} captured ${oppositeCubes} cubes!`);
        }
      }
    }

    setBoard(newBoard);

    if (checkGameEnd(newBoard)) {
      return;
    }

    if (!freeTurn) {
      setTimeout(() => {
        const nextPlayer = currentPlayer === 'A' ? 'B' : 'A';
        setCurrentPlayer(nextPlayer);
        if (!captured) {
          setMessage(`Player ${nextPlayer === 'A' ? '1' : '2'}: Select a pit to pick up cubes`);
        }
      }, 500);
    }
  };

  // Handle pit click
  const handlePitClick = (pitIndex) => {
    if (gameOver) return;

    const currentPits = currentPlayer === 'A' ? board.playerA : board.playerB;

    if (currentPits[pitIndex] === 0) return;

    if (autoMove) {
      autoDistribute(pitIndex);
    } else {
      handlePickup(pitIndex);
    }
  };

  // Undo pickup
  const handleUndoPickup = () => {
    if (!learningMode || !originalPickup || cubesPlaced > 0) return;

    const newBoard = { ...board };
    const { player, pitIndex, cubes } = originalPickup;

    if (player === 'A') {
      newBoard.playerA[pitIndex] = cubes;
    } else {
      newBoard.playerB[pitIndex] = cubes;
    }

    setBoard(newBoard);
    setCubesInHand(0);
    setNextHighlight(null);
    setOriginalPickup(null);
    setCubesPlaced(0);
    setMessage(`Player ${currentPlayer === 'A' ? '1' : '2'}: Select a pit to pick up cubes`);
  };

  // Reset game
  const resetGame = () => {
    setBoard({
      playerA: [3, 3, 4, 3, 3],
      playerB: [3, 3, 4, 3, 3],
      callaA: 0,
      callaB: 0
    });
    setCurrentPlayer('A');
    setMessage('Player 1: Select a pit to pick up cubes');
    setGameOver(false);
    setCubesInHand(0);
    setNextHighlight(null);
    setOriginalPickup(null);
    setCubesPlaced(0);
  };

  const isHighlighted = (side, index, isCalla = false) => {
    if (!nextHighlight) return false;
    return nextHighlight.side === side &&
           nextHighlight.index === index &&
           nextHighlight.isCalla === isCalla;
  };

  return (
    <div className="game-screen">
      <div className="network-info">
        <div className="player-indicator">Local Multiplayer</div>
        <button className="back-btn" onClick={onBackToMenu}>
          Back to Menu
        </button>
      </div>

      <GameInfo
        message={message}
        autoMove={autoMove}
        onAutoMoveChange={setAutoMove}
        learningMode={learningMode}
        onLearningModeChange={setLearningMode}
        onReset={resetGame}
        onUndoPickup={handleUndoPickup}
        canUndo={learningMode && cubesInHand > 0 && cubesPlaced === 0}
      />

      <Board
        board={board}
        currentPlayer={currentPlayer}
        gameOver={gameOver}
        cubesInHand={cubesInHand}
        isHighlighted={isHighlighted}
        handlePitClick={handlePitClick}
        handlePlaceCube={handlePlaceCube}
      />

      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <h2>Game Over!</h2>
            <p>{message}</p>
            <button onClick={resetGame}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocalGame;

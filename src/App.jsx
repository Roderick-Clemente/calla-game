import { useState } from 'react';
import './App.css';
import GameInfo from './components/GameInfo';
import Board from './components/Board';

function App() {
  // Initialize game state
  const [board, setBoard] = useState({
    playerA: [3, 3, 4, 3, 3], // 5 pits, center pit (index 2) has 4 cubes
    playerB: [3, 3, 4, 3, 3],
    callaA: 0,
    callaB: 0
  });

  const [currentPlayer, setCurrentPlayer] = useState('A');
  const [message, setMessage] = useState('Player 1: Select a pit to pick up cubes');
  const [gameOver, setGameOver] = useState(false);
  const [autoMove, setAutoMove] = useState(false);

  // Manual move state
  const [cubesInHand, setCubesInHand] = useState(0);
  const [nextHighlight, setNextHighlight] = useState(null); // Next position to click

  // Calculate next position counter-clockwise
  const getNextPosition = (currentPos, isPlayerA) => {
    if (!currentPos) return null;

    const { side, index } = currentPos;

    // Counter-clockwise pattern (continuous around the board):
    // PlayerA: pit 0 -> 1 -> 2 -> 3 -> 4 -> CallaA -> PlayerB: pit 0 -> 1 -> 2 -> 3 -> 4 -> CallaB (skip if opponent) -> PlayerA: pit 0...

    if (side === 'A') {
      if (index < 4) {
        // Move to next pit on Player A side
        return { side: 'A', index: index + 1, isCalla: false };
      } else {
        // At end of Player A pits (index 4), move to Calla A if current player is A
        if (isPlayerA) {
          return { side: 'callaA', index: null, isCalla: true };
        } else {
          // Skip Calla A, go to Player B pit 0
          return { side: 'B', index: 0, isCalla: false };
        }
      }
    } else if (side === 'callaA') {
      // After Calla A, go to Player B pit 0
      return { side: 'B', index: 0, isCalla: false };
    } else if (side === 'B') {
      if (index < 4) {
        // Move to next pit on Player B side (0 -> 1 -> 2 -> 3 -> 4)
        return { side: 'B', index: index + 1, isCalla: false };
      } else {
        // At end of Player B pits (index 4), move to Calla B if current player is B
        if (!isPlayerA) {
          return { side: 'callaB', index: null, isCalla: true };
        } else {
          // Skip Calla B, go to Player A pit 0
          return { side: 'A', index: 0, isCalla: false };
        }
      }
    } else if (side === 'callaB') {
      // After Calla B, go to Player A pit 0
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

    // Can't click empty pit
    if (currentPits[pitIndex] === 0) return;

    // Pick up cubes
    const newBoard = { ...board };
    const cubes = currentPits[pitIndex];

    if (currentPlayer === 'A') {
      newBoard.playerA[pitIndex] = 0;
    } else {
      newBoard.playerB[pitIndex] = 0;
    }

    setBoard(newBoard);
    setCubesInHand(cubes);

    // Calculate next position
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

    // Place cube
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

    const remainingCubes = cubesInHand - 1;
    setCubesInHand(remainingCubes);

    if (remainingCubes > 0) {
      // More cubes to place, calculate next position
      const next = getNextPosition(nextHighlight, currentPlayer === 'A');
      setNextHighlight(next);
      setMessage(`${remainingCubes} cubes left. Click the highlighted pit.`);
    } else {
      // All cubes placed, check for special rules
      const lastPos = nextHighlight;
      let freeTurn = false;
      let captured = false;

      // Free turn: last cube lands in own Calla
      if (lastPos.isCalla) {
        if ((currentPlayer === 'A' && lastPos.side === 'callaA') ||
            (currentPlayer === 'B' && lastPos.side === 'callaB')) {
          freeTurn = true;
          setMessage(`${currentPlayer === 'A' ? 'Player 1' : 'Player 2'} gets a free turn! Select a pit.`);
        }
      }

      // Capture: last cube lands in own empty pit (was 0, now has 1)
      if (!lastPos.isCalla && lastPos.side === currentPlayer) {
        const pitCubes = lastPos.side === 'A' ? newBoard.playerA[lastPos.index] : newBoard.playerB[lastPos.index];

        if (pitCubes === 1) {
          // Calculate opposite pit
          const oppositePitIdx = 4 - lastPos.index;
          const oppositeSide = currentPlayer === 'A' ? 'B' : 'A';
          const oppositeCubes = oppositeSide === 'A' ? newBoard.playerA[oppositePitIdx] : newBoard.playerB[oppositePitIdx];

          if (oppositeCubes > 0) {
            // Capture: move cubes from opposite pit to your Calla
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

      // Update board state before checking for game end
      setBoard(newBoard);
      setNextHighlight(null);

      // Check for game end immediately
      if (checkGameEnd(newBoard)) {
        return; // Game is over, no more actions
      }

      // Switch turns if not a free turn
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

  // Auto-move function (original behavior)
  const autoDistribute = (pitIndex) => {
    const newBoard = { ...board };
    const isPlayerA = currentPlayer === 'A';

    // Pick up cubes from selected pit
    let cubes = isPlayerA ? newBoard.playerA[pitIndex] : newBoard.playerB[pitIndex];

    if (isPlayerA) {
      newBoard.playerA[pitIndex] = 0;
    } else {
      newBoard.playerB[pitIndex] = 0;
    }

    // Track position for distribution
    let currentPos = { side: currentPlayer, index: pitIndex, isCalla: false };
    let lastPos = null;

    // Distribute cubes one by one
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

    // Check for special rules
    let freeTurn = false;
    let captured = false;

    // Free turn
    if (lastPos.isCalla) {
      if ((isPlayerA && lastPos.side === 'callaA') || (!isPlayerA && lastPos.side === 'callaB')) {
        freeTurn = true;
        setMessage(`${currentPlayer === 'A' ? 'Player 1' : 'Player 2'} gets a free turn!`);
      }
    }

    // Capture
    if (!lastPos.isCalla && lastPos.side === currentPlayer) {
      const pitCubes = lastPos.side === 'A' ? newBoard.playerA[lastPos.index] : newBoard.playerB[lastPos.index];

      if (pitCubes === 1) {
        const oppositePitIdx = 4 - lastPos.index;
        const oppositeSide = currentPlayer === 'A' ? 'B' : 'A';
        const oppositeCubes = oppositeSide === 'A' ? newBoard.playerA[oppositePitIdx] : newBoard.playerB[oppositePitIdx];

        if (oppositeCubes > 0) {
          // Capture: move cubes from opposite pit to your Calla
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

    // Check for game end immediately
    if (checkGameEnd(newBoard)) {
      return; // Game is over
    }

    // Switch turns or give free turn
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

  // Handle pit click (manual or auto)
  const handlePitClick = (pitIndex) => {
    if (gameOver) return;

    const currentPits = currentPlayer === 'A' ? board.playerA : board.playerB;

    // Can't click empty pit
    if (currentPits[pitIndex] === 0) return;

    if (autoMove) {
      autoDistribute(pitIndex);
    } else {
      handlePickup(pitIndex);
    }
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
  };

  // Helper to check if a position should be highlighted
  const isHighlighted = (side, index, isCalla = false) => {
    if (!nextHighlight) return false;
    return nextHighlight.side === side &&
           nextHighlight.index === index &&
           nextHighlight.isCalla === isCalla;
  };

  return (
    <div className="app">
      <GameInfo
        message={message}
        autoMove={autoMove}
        onAutoMoveChange={setAutoMove}
        onReset={resetGame}
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

export default App;

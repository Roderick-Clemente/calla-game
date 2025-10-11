import React from 'react';
import PlayerSide from './PlayerSide';
import Calla from './Calla';

const Board = ({
  board,
  currentPlayer,
  gameOver,
  cubesInHand,
  isHighlighted,
  handlePitClick,
  handlePlaceCube,
}) => {
  return (
    <div className="game-board">
      <PlayerSide
        player="B"
        pits={board.playerB}
        currentPlayer={currentPlayer}
        gameOver={gameOver}
        cubesInHand={cubesInHand}
        isHighlighted={isHighlighted}
        handlePitClick={handlePitClick}
        handlePlaceCube={handlePlaceCube}
      />

      <div className="callas-row">
        <Calla
          player="B"
          count={board.callaB}
          isHighlighted={isHighlighted('callaB', null, true)}
          onClick={() => {
            if (isHighlighted('callaB', null, true)) {
              handlePlaceCube();
            }
          }}
        />

        <div className="board-center">
          <div className="direction-indicator">↺ Counter-clockwise</div>
          {cubesInHand > 0 && (
            <div className="cubes-in-hand">
              Cubes in hand: {cubesInHand}
            </div>
          )}
        </div>

        <Calla
          player="A"
          count={board.callaA}
          isHighlighted={isHighlighted('callaA', null, true)}
          onClick={() => {
            if (isHighlighted('callaA', null, true)) {
              handlePlaceCube();
            }
          }}
        />
      </div>

      <PlayerSide
        player="A"
        pits={board.playerA}
        currentPlayer={currentPlayer}
        gameOver={gameOver}
        cubesInHand={cubesInHand}
        isHighlighted={isHighlighted}
        handlePitClick={handlePitClick}
        handlePlaceCube={handlePlaceCube}
      />
    </div>
  );
};

export default Board;

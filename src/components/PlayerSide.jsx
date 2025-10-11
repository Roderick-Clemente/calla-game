import React from 'react';
import Pit from './Pit';

const PlayerSide = ({
  player,
  pits,
  currentPlayer,
  gameOver,
  cubesInHand,
  isHighlighted,
  handlePitClick,
  handlePlaceCube,
}) => {
  const playerLabel = `Player ${player === 'A' ? '1' : '2'}`;
  const pitsToRender = player === 'B' ? [...pits].reverse() : pits;

  return (
    <div className={`player-side player-${player.toLowerCase()}`}>
      {player === 'A' && <div className="player-label">{playerLabel}</div>}
      <div className="pits-container">
        {pitsToRender.map((cubes, index) => {
          const originalIndex = player === 'B' ? 4 - index : index;
          const isPitClickable =
            currentPlayer === player && !gameOver && cubesInHand === 0 && cubes > 0;
          const isPitHighlighted = isHighlighted(player, originalIndex, false);

          return (
            <Pit
              key={`${player}-${originalIndex}`}
              cubes={cubes}
              pitIndex={originalIndex}
              player={player}
              isClickable={isPitClickable}
              isHighlighted={isPitHighlighted}
              onClick={() => {
                if (isPitClickable) {
                  handlePitClick(originalIndex);
                } else if (isPitHighlighted) {
                  handlePlaceCube();
                }
              }}
            />
          );
        })}
      </div>
      {player === 'B' && <div className="player-label">{playerLabel}</div>}
    </div>
  );
};

export default PlayerSide;

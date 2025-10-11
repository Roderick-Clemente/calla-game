import React from 'react';
import { renderCubeCount, getPitLetter } from '../utils.jsx';

const Pit = ({
  cubes,
  pitIndex,
  player,
  isClickable,
  isHighlighted,
  onClick,
}) => {
  const pitLabel = `Pit ${getPitLetter(pitIndex)}`;
  const isCenterPit = pitIndex === 2;

  return (
    <div
      className={`pit ${isClickable ? 'clickable' : ''} ${isCenterPit ? 'center-pit' : ''} ${isHighlighted ? 'highlighted' : ''} pit-player-${player.toLowerCase()}`}
      onClick={onClick}
    >
      {player === 'A' ? (
        <>
          {renderCubeCount(cubes)}
          <div className="pit-label">{pitLabel}</div>
        </>
      ) : (
        <>
          <div className="pit-label">{pitLabel}</div>
          {renderCubeCount(cubes)}
        </>
      )}
    </div>
  );
};

export default Pit;

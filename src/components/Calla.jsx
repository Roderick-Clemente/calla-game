import React from 'react';

const Calla = ({ player, count, isHighlighted, onClick }) => {
  const playerLabel = player === 'A' ? 'Player 1' : 'Player 2';

  return (
    <div
      className={`calla calla-${player.toLowerCase()} ${isHighlighted ? 'highlighted' : ''}`}
      onClick={onClick}
    >
      <div className="calla-label">CALLA</div>
      <div className="calla-count">{count}</div>
      <div className="calla-player">{playerLabel}</div>
    </div>
  );
};

export default Calla;

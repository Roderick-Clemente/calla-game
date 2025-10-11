import React from 'react';

const GameInfo = ({ message, autoMove, onAutoMoveChange, onReset }) => {
  return (
    <div className="game-header">
      <h1>Calla Game</h1>
      <div className="subtitle">A Mathematics Perseverance Game</div>
      <div className="game-info">
        <div className="message">{message}</div>
        <div className="controls">
          <label className="auto-move-toggle">
            <input
              type="checkbox"
              checked={autoMove}
              onChange={(e) => onAutoMoveChange(e.target.checked)}
            />
            Auto-move cubes
          </label>
          <button className="new-game-btn" onClick={onReset}>
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameInfo;

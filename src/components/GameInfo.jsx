import React from 'react';

const GameInfo = ({
  message,
  autoMove,
  onAutoMoveChange,
  learningMode,
  onLearningModeChange,
  onReset,
  onUndoPickup,
  canUndo,
  hideControls = false
}) => {
  return (
    <div className="game-header">
      <h1>Calla Game</h1>
      <div className="subtitle">A Mathematics Perseverance Game</div>
      <div className="game-info">
        <div className="message">{message}</div>
        {!hideControls && (
          <div className="controls">
          <label
            className={`auto-move-toggle ${learningMode ? 'disabled' : ''}`}
            title={learningMode ? "Auto-move not available in learning mode" : "Automatically distribute cubes when you click a pit"}
          >
            <input
              type="checkbox"
              checked={autoMove}
              onChange={(e) => onAutoMoveChange(e.target.checked)}
              disabled={learningMode}
            />
            Auto-move cubes
          </label>
          <label
            className={`auto-move-toggle ${autoMove ? 'disabled' : ''}`}
            title={autoMove ? "Learning mode not available with auto-move" : "Allows you to pick up and put back down cubes before placing your first cube"}
          >
            <input
              type="checkbox"
              checked={learningMode}
              onChange={(e) => onLearningModeChange(e.target.checked)}
              disabled={autoMove}
            />
            Learning mode
          </label>
          <button
            className={`undo-btn ${canUndo ? '' : 'disabled'}`}
            onClick={onUndoPickup}
            disabled={!canUndo}
          >
            Undo Pickup
          </button>
          <button className="new-game-btn" onClick={onReset}>
            New Game
          </button>
        </div>
        )}
      </div>
    </div>
  );
};

export default GameInfo;

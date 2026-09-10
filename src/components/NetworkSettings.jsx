import React, { useState } from 'react';

/**
 * NetworkSettings - Configure game settings before matchmaking
 */
const NetworkSettings = ({ onStartMatchmaking, onBack }) => {
  const [autoMove, setAutoMove] = useState(false);
  const [learningMode, setLearningMode] = useState(false);

  const handleStart = () => {
    onStartMatchmaking({ autoMove, learningMode });
  };

  return (
    <div className="menu-content">
      <h2>Network Game Settings</h2>
      <p className="settings-description">
        Choose your game settings. You'll be matched with an opponent using the same settings.
      </p>

      <div className="settings-options">
        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={autoMove}
            onChange={(e) => setAutoMove(e.target.checked)}
          />
          <div className="setting-info">
            <div className="setting-title">Auto-move cubes</div>
            <div className="setting-desc">Automatically distribute cubes when you click a pit</div>
          </div>
        </label>

        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={learningMode}
            onChange={(e) => setLearningMode(e.target.checked)}
          />
          <div className="setting-info">
            <div className="setting-title">Learning mode</div>
            <div className="setting-desc">Allows you to undo cube pickup before placing your first cube</div>
          </div>
        </label>
      </div>

      <div className="settings-buttons">
        <button className="new-game-btn" onClick={handleStart}>
          Find Opponent
        </button>
        <button className="back-btn" onClick={onBack}>
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default NetworkSettings;

import React from 'react';

const MenuScreen = ({ onSelectMode, statusText }) => {
  return (
    <div className="menu-screen">
      <div className="menu-content">
        <h1 className="menu-title">Calla Game</h1>
        <div className="menu-subtitle">A Mathematics Perseverance Game</div>

        <h2 className="mode-selection-title">Select Game Mode</h2>

        <div className="mode-buttons">
          <button
            className="mode-btn"
            onClick={() => onSelectMode('local')}
          >
            <div className="mode-icon">🏠</div>
            <div className="mode-title">Local Game</div>
            <div className="mode-desc">Play on the same device</div>
          </button>

          <button
            className="mode-btn"
            onClick={() => onSelectMode('network')}
          >
            <div className="mode-icon">🌐</div>
            <div className="mode-title">Network Multiplayer</div>
            <div className="mode-desc">Play online with a friend</div>
          </button>
        </div>

        {statusText && (
          <p className="status-text">{statusText}</p>
        )}
      </div>
    </div>
  );
};

export default MenuScreen;

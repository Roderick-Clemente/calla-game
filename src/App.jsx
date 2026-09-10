import { useState } from 'react';
import './App.css';
import MenuScreen from './components/MenuScreen';
import LocalGame from './components/LocalGame';
import NetworkGame from './components/NetworkGame';
import NetworkSettings from './components/NetworkSettings';

/**
 * Main App Component
 * Handles mode selection (Local vs Network) and renders the appropriate game component
 */
function App() {
  const [gameMode, setGameMode] = useState(null); // null, 'local', 'network-settings', or 'network'
  const [networkSettings, setNetworkSettings] = useState(null);
  const [statusText, setStatusText] = useState('');

  const handleSelectMode = (mode) => {
    if (mode === 'local') {
      setGameMode('local');
    } else if (mode === 'network') {
      setGameMode('network-settings'); // Show settings first
    }
  };

  const handleStartMatchmaking = (settings) => {
    setNetworkSettings(settings);
    setGameMode('network');
    setStatusText('Connecting to server...');
  };

  const handleBackToMenu = () => {
    setGameMode(null);
    setNetworkSettings(null);
    setStatusText('');
  };

  return (
    <div className="app">
      {!gameMode && (
        <MenuScreen
          onSelectMode={handleSelectMode}
          statusText={statusText}
        />
      )}

      {gameMode === 'local' && (
        <LocalGame onBackToMenu={handleBackToMenu} />
      )}

      {gameMode === 'network-settings' && (
        <NetworkSettings
          onStartMatchmaking={handleStartMatchmaking}
          onBack={handleBackToMenu}
        />
      )}

      {gameMode === 'network' && (
        <NetworkGame
          onBackToMenu={handleBackToMenu}
          settings={networkSettings}
        />
      )}
    </div>
  );
}

export default App;

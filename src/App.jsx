import { useState } from 'react';
import './App.css';
import MenuScreen from './components/MenuScreen';
import LocalGame from './components/LocalGame';
import NetworkGame from './components/NetworkGame';

/**
 * Main App Component
 * Handles mode selection (Local vs Network) and renders the appropriate game component
 */
function App() {
  const [gameMode, setGameMode] = useState(null); // null, 'local', or 'network'
  const [statusText, setStatusText] = useState('');

  const handleSelectMode = (mode) => {
    if (mode === 'local') {
      setGameMode('local');
    } else if (mode === 'network') {
      setGameMode('network');
      setStatusText('Connecting to server...');
    }
  };

  const handleBackToMenu = () => {
    setGameMode(null);
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

      {gameMode === 'network' && (
        <NetworkGame onBackToMenu={handleBackToMenu} />
      )}
    </div>
  );
}

export default App;

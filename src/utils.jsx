// Render cube count as visual cubes for small numbers, or number for larger
export const renderCubeCount = (count) => {
  if (count <= 4) {
    // Show visual ice cube emojis
    return (
      <div className="cube-visual">
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} className="cube-icon">🧊</span>
        ))}
      </div>
    );
  } else {
    // Show number for larger counts
    return <div className="cube-count">{count}</div>;
  }
};

// Convert pit index to letter (0 -> A, 1 -> B, etc.)
export const getPitLetter = (index) => {
  return String.fromCharCode(65 + index); // 65 is 'A' in ASCII
};

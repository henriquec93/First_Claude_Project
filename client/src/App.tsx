import React, { useEffect, useState } from 'react';

function App() {
  const [health, setHealth] = useState<string>('checking...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data.status))
      .catch(() => setHealth('server unreachable'));
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Browser Game</h1>
      <p>
        API health: <strong>{health}</strong>
      </p>
    </div>
  );
}

export default App;

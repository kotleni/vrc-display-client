// app/components/ScrollTextManager.tsx
'use client';
import React, { useState } from 'react';
interface ScrollTextManagerProps { onStartScroll: () => void; onStopScroll: () => void; displayStatus: (message: string, isError?: boolean) => void; }
const ScrollTextManager: React.FC<ScrollTextManagerProps> = ({ onStartScroll, onStopScroll, displayStatus }) => {
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(150);

  const handleStartScroll = async () => {
    if (!text) { displayStatus('Please enter text to scroll.', true); return; }
    onStartScroll();
    try {
      const response = await fetch('/api/scrolltext/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, speed }) });
      const data = await response.json(); displayStatus(data.message, !data.success);
      if (!data.success) onStopScroll(); // If server fails to start, ensure client state matches
    } catch (error) { displayStatus('Error starting scroll.', true); onStopScroll(); }
  };

  const handleStopScroll = async () => {
    onStopScroll();
    try {
      const response = await fetch('/api/scrolltext/stop', { method: 'POST' });
      const data = await response.json(); displayStatus(data.message, !data.success);
    } catch (error) { displayStatus('Error stopping scroll.', true); }
  };

  return (
    <div className="module-container">
      <h2>Scrolling Text</h2>
      <div className="control-group">
        <label htmlFor="scrollTextInput">Text:</label>
        <input type="text" id="scrollTextInput" placeholder="Enter text" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="control-group">
        <label htmlFor="scrollSpeedInput">Speed (ms/col):</label>
        <input type="number" id="scrollSpeedInput" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value,10))} min="20" step="10" style={{width:"80px"}} />
      </div>
      <div className="controls">
        <button onClick={handleStartScroll}>Start Scroll</button>
        <button onClick={handleStopScroll} className="btn-danger">Stop Scroll</button>
      </div>
    </div>
  );
};
export default ScrollTextManager;
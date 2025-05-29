// app/components/AnimationManager.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { GRID_SIZE } from '@/app/lib/font';

interface AnimationManagerProps {
  initialFrames: boolean[][];
  gridSize: number;
  onPlayAnimation: (frames: boolean[][][], delay: number) => void;
  onStopAnimation: () => void;
  onLoadAnimationFrames: (frames: boolean[][][], frameIndex: number) => void; // Pass current index
  displayStatus: (message: string, isError?: boolean) => void;
}

const AnimationManager: React.FC<AnimationManagerProps> = ({
  initialFrames,
  gridSize,
  onPlayAnimation,
  onStopAnimation,
  onLoadAnimationFrames,
  displayStatus,
}) => {
  const [frames, setFrames] = useState<boolean[][][]>(() => [JSON.parse(JSON.stringify(initialFrames))]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [delay, setDelay] = useState(200);
  const [animationName, setAnimationName] = useState('');
  const [animations, setAnimations] = useState<string[]>([]);
  const [selectedAnimation, setSelectedAnimation] = useState('');

  const deepCopyGrid = (grid: boolean[][]) => JSON.parse(JSON.stringify(grid));

  useEffect(() => {
    const initialGridCopy = deepCopyGrid(initialFrames);
    if (frames.length === 1 && JSON.stringify(frames[0]) !== JSON.stringify(initialGridCopy)) {
        setFrames([initialGridCopy]);
        setCurrentFrameIdx(0);
        onLoadAnimationFrames([initialGridCopy], 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFrames]); // Only react to initialFrames change


  const fetchAnimations = useCallback(async () => {
    try {
      const response = await fetch('/api/animations');
      const data = await response.json();
      if (data.success && data.animations) {
        setAnimations(data.animations);
      } else {
        displayStatus(data.message || "Could not fetch animations.", true);
      }
    } catch (error) {
      displayStatus('Error fetching animations.', true);
    }
  }, [displayStatus]);

  useEffect(() => {
    fetchAnimations();
  }, [fetchAnimations]);

  const updateCurrentFrameInfoText = () => `Frame ${currentFrameIdx + 1} / ${frames.length || 1}`;

  const renderFramePreview = (frameData: boolean[][], index: number) => (
    <div
      key={`anim-frame-${index}`}
      className={`animation-frame-preview ${index === currentFrameIdx ? 'selected' : ''}`}
      data-frame-index={index}
      onClick={() => {
        onStopAnimation();
        setCurrentFrameIdx(index);
        onLoadAnimationFrames(frames, index);
      }}
    >
      {frameData && frameData.map((row, y) =>
        row.map((cell, x) => <div key={`cell-${index}-${y}-${x}`} className={`grid-cell ${cell ? 'on' : ''}`} />)
      )}
    </div>
  );

  const handleAddFrame = () => {
    onStopAnimation();
    const newFrame = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    const newFrames = [...frames];
    const insertAtIndex = currentFrameIdx + 1;
    newFrames.splice(insertAtIndex, 0, newFrame);
    setFrames(newFrames);
    setCurrentFrameIdx(insertAtIndex);
    onLoadAnimationFrames(newFrames, insertAtIndex);
  };

  const handleDeleteFrame = () => {
    onStopAnimation();
    if (frames.length <= 1) {
      displayStatus("Cannot delete the last frame.", true);
      return;
    }
    const newFrames = frames.filter((_, i) => i !== currentFrameIdx);
    let newIdx = currentFrameIdx;
    if (newIdx >= newFrames.length) {
      newIdx = newFrames.length - 1;
    }
    setFrames(newFrames);
    setCurrentFrameIdx(newIdx);
    onLoadAnimationFrames(newFrames, newIdx);
  };

  const handleClearFrame = () => {
    onStopAnimation();
    const newFrames = frames.map((frame, index) =>
        index === currentFrameIdx ? Array(gridSize).fill(null).map(() => Array(gridSize).fill(false)) : frame
    );
    setFrames(newFrames);
    onLoadAnimationFrames(newFrames, currentFrameIdx);
    displayStatus(`Frame ${currentFrameIdx + 1} cleared.`);
  };

  const handlePrevFrame = () => {
    onStopAnimation();
    if (frames.length === 0) return;
    const newIdx = (currentFrameIdx - 1 + frames.length) % frames.length;
    setCurrentFrameIdx(newIdx);
    onLoadAnimationFrames(frames, newIdx);
  };

  const handleNextFrame = () => {
    onStopAnimation();
    if (frames.length === 0) return;
    const newIdx = (currentFrameIdx + 1) % frames.length;
    setCurrentFrameIdx(newIdx);
    onLoadAnimationFrames(frames, newIdx);
  };

  const handlePlayAnimation = async () => {
    if (frames.length === 0) {
      displayStatus("No frames to play.", true);
      return;
    }
    if (isNaN(delay) || delay < 20) {
      displayStatus("Invalid animation delay.", true);
      return;
    }
    onPlayAnimation(frames, delay);
    try {
      const response = await fetch(`/api/animations/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames, delay })
      });
      const data = await response.json();
      displayStatus(data.message, !data.success);
      if (!data.success) onStopAnimation();
    } catch (error) {
      displayStatus("Error playing animation.", true);
      onStopAnimation();
    }
  };

  const handleApiStopAnimation = async () => {
      onStopAnimation();
      try {
          const response = await fetch('/api/animations/stop', {method: 'POST'});
          const data = await response.json(); displayStatus(data.message, !data.success);
      } catch(error) {displayStatus("Error stopping animation.", true);}
  };

  const handleSaveAnimation = async () => {
    if (!animationName) {
      displayStatus('Animation name cannot be empty.', true);
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(animationName)) {
      displayStatus('Animation name invalid characters.', true);
      return;
    }
    if (frames.length === 0) {
      displayStatus('No frames to save.', true);
      return;
    }
    if (isNaN(delay) || delay < 20) {
      displayStatus("Invalid animation delay for saving.", true);
      return;
    }
    try {
      const response = await fetch('/api/animations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: animationName, frames, delay })
      });
      const data = await response.json();
      displayStatus(data.message, !data.success);
      if (data.success) {
        fetchAnimations();
        setAnimationName('');
      }
    } catch (error) {
      displayStatus('Error saving animation.', true);
    }
  };

  const handleLoadAnimation = async () => {
    if (!selectedAnimation) {
      displayStatus('Please select an animation to load.', true);
      return;
    }
    onPlayAnimation([],0);
    try {
      const response = await fetch(`/api/animations/load/${selectedAnimation}`);
      const data = await response.json();
      displayStatus(data.message, !data.success);
      if (data.success && data.animation) {
        setFrames(data.animation.frames);
        setDelay(data.animation.delay);
        const newIdx = 0;
        setCurrentFrameIdx(newIdx);
        onLoadAnimationFrames(data.animation.frames, newIdx);
      } else {
        onStopAnimation();
      }
    } catch (error) {
      displayStatus('Error loading animation.', true);
      onStopAnimation();
    }
  };
  
  useEffect(() => {
    // When frames or currentFrameIdx changes, tell the parent (HomePage)
    // This ensures the main PixelGridCanvas displays the correct frame for editing
    if (frames.length > 0 && currentFrameIdx < frames.length) {
        onLoadAnimationFrames(frames, currentFrameIdx);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, currentFrameIdx]);


  return (
    <div className="module-container">
      <h2>Animation Mode</h2>
      <div className="animation-frames-controls frame-nav-buttons">
        <button onClick={handlePrevFrame}>Prev</button>
        <span style={{ margin: '0 10px' }}>{updateCurrentFrameInfoText()}</span>
        <button onClick={handleNextFrame}>Next</button>
      </div>
      <div className="animation-frame-preview-container">
        {frames.map((frame, index) => renderFramePreview(frame, index))}
      </div>
      <div className="controls">
        <button onClick={handleAddFrame}>Add Frame</button>
        <button onClick={handleDeleteFrame} className="btn-danger">Del Frame</button>
        <button onClick={handleClearFrame} className="btn-warning">Clear Frame</button>
      </div>
      <div className="control-group">
        <label htmlFor="animDelayInputCtrl">Frame Delay (ms):</label>
        <input type="number" id="animDelayInputCtrl" value={delay} onChange={(e) => setDelay(parseInt(e.target.value, 10))} min="20" step="10" style={{ width: "80px" }} />
      </div>
      <div className="controls">
        <button onClick={handlePlayAnimation}>Play Animation</button>
        <button onClick={handleApiStopAnimation} className="btn-danger">Stop Animation</button>
      </div>
      <div className="control-group" style={{ marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
        <label htmlFor="animNameInputCtrl">Anim Name:</label>
        <input type="text" id="animNameInputCtrl" placeholder="Animation Name" value={animationName} onChange={(e) => setAnimationName(e.target.value)} />
        <button onClick={handleSaveAnimation} className="btn-warning">Save Anim</button>
      </div>
      <div className="control-group">
        <label htmlFor="animSelectCtrl">Load Anim:</label>
        <select id="animSelectCtrl" value={selectedAnimation} onChange={(e) => setSelectedAnimation(e.target.value)}>
          <option value="">--Select Anim--</option>
          {animations.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <button onClick={handleLoadAnimation}>Load Anim</button>
      </div>
    </div>
  );
};
export default AnimationManager;
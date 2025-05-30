// app/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import PixelGridCanvas from './components/PixelGridCanvas';
import DrawingPresetsManager from './components/DrawingPresetsManager';
import ScrollTextManager from './components/ScrollTextManager';
import AnimationManager from './components/AnimationManager';
import PixelGridPreview from './components/PixelGridPreview';
import { GRID_SIZE } from './lib/font';
import SandboxesManager from "@/app/components/SandboxesManager";

type Mode = 'draw' | 'scroll' | 'animation' | 'sandbox';

export default function HomePage() {
  const [pixelGrid, setPixelGrid] = useState<boolean[][]>(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
  const [statusDraw, setStatusDraw] = useState<{ message: string, isError: boolean } | null>(null);
  const [activeAutomation, setActiveAutomation] = useState<'scroll' | 'animation' | 'sandbox' | null>(null);
  const [currentMode, setCurrentMode] = useState<Mode>('draw');

  const displayStatus = useCallback((setter: React.Dispatch<React.SetStateAction<{ message: string, isError: boolean } | null>>, message: string, isError = false) => {
    setter({ message, isError }); setTimeout(() => setter(null), 3000);
  }, []);

  const fetchGrid = useCallback(async (calledByAutomationStop = false) => {
    try {
      const response = await fetch('/api/grid'); const data = await response.json();
      if (data.success && data.grid) {
        // Only update main canvas if no automation is running OR if an automation just stopped OR if we are not in animation mode (where AnimationManager controls the grid)
        if (!activeAutomation || calledByAutomationStop) { // Only update main canvas if no automation is running or it just stopped
            setPixelGrid(data.grid);
        }
      }
    } catch (error) { displayStatus(setStatusDraw, 'Error fetching grid state.', true); }
  }, [setStatusDraw, activeAutomation]);

  useEffect(() => { fetchGrid(); }, [fetchGrid]);

  const handleGridChange = useCallback(async (newGrid: boolean[][]) => {
    setPixelGrid(newGrid);
    // If in animation mode, AnimationManager's useEffect will pick up this change to pixelGrid
    // and update its internal current frame.

    // Only persist to the general /api/grid if no automation is supposed to be controlling it,
    // or if we are in draw/animation mode where the grid is being directly manipulated.
    if (!activeAutomation || currentMode === 'draw' || (currentMode === 'animation' && !activeAutomation)) {
        try {
            await fetch('/api/grid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newGrid }), });
        } catch (error) { displayStatus(setStatusDraw, 'Error saving drawing to server.', true); }
    }
  }, [activeAutomation, currentMode, setStatusDraw]);

  const handleStopAllAutomations = useCallback(async (tellServer: boolean = true) => {
    let wasActive = activeAutomation;
    if (tellServer) {
        if (activeAutomation === 'scroll') await fetch('/api/scrolltext/stop', { method: 'POST' });
        if (activeAutomation === 'animation') await fetch('/api/animations/stop', { method: 'POST' });
        if (activeAutomation === 'sandbox') await fetch('/api/sandbox/stop', { method: 'POST' });
    }
    setActiveAutomation(null);
    if (wasActive) {
        // Fetch grid state, unless we are in animation mode where the grid might be managed differently
        if (currentMode !== 'animation' || !wasActive) await fetchGrid(true);
    }
  }, [activeAutomation, fetchGrid]);

  const handleSendToVRC = async () => {
    await handleStopAllAutomations(true);
    try {
      await fetch('/api/grid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newGrid: pixelGrid }) });
      const response = await fetch('/api/send', { method: 'POST' }); const data = await response.json();
      displayStatus(setStatusDraw, data.message || 'Sent to VRChat.');
    } catch (error) { displayStatus(setStatusDraw, 'Error sending data.', true); }
  };

  const handleClearGrid = async () => {
    await handleStopAllAutomations(true);
    try {
      const response = await fetch('/api/clear', { method: 'POST' }); const data = await response.json();
      if (data.grid) setPixelGrid(data.grid);
      displayStatus(setStatusDraw, data.message || 'Grid cleared.');
    } catch (error) { displayStatus(setStatusDraw, 'Error clearing grid.', true); }
  };

  const handleAutomationStart = async (type: 'scroll' | 'animation' | 'sandbox') => {
    if (activeAutomation && activeAutomation !== type) await handleStopAllAutomations(true);
    setActiveAutomation(type);
  };

  const handleChangeMode = async (newMode: Mode) => {
    if (currentMode === newMode) return;
    await handleStopAllAutomations(true); // Stop any current automation & fetch grid
    setCurrentMode(newMode);
    if (newMode !== 'animation') {
        await fetchGrid(true);
    }
  };

  const handlePixelGridInteraction = async () => {
    const previousAutomation = activeAutomation;
    await handleStopAllAutomations(true); // Stops automation, activeAutomation is null, fetches grid.

    if (currentMode === 'scroll' || currentMode === 'sandbox') {
        setCurrentMode('draw');
    } else if (currentMode === 'animation' && previousAutomation === 'animation') {
    } else if (currentMode !== 'draw') {
        setCurrentMode('draw');
    }
  };

  const handleAnimationManagerRequestsDisplayFrame = useCallback((allAnimFrames: boolean[][][], frameIdxToShow: number) => {
    if (activeAutomation !== 'animation') { // Only update display if animation isn't actively playing and overriding
        const frameToDisplay = allAnimFrames[frameIdxToShow] || Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
        setPixelGrid(frameToDisplay);
    }
  }, [activeAutomation]);

  return (
    <main className="main-column">
      <div className="mode-selector control-group">
        <button onClick={() => handleChangeMode('draw')} className={currentMode === 'draw' ? 'active' : ''}>Draw</button>
        <button onClick={() => handleChangeMode('scroll')} className={currentMode === 'scroll' ? 'active' : ''}>Scroll Text</button>
        <button onClick={() => handleChangeMode('animation')} className={currentMode === 'animation' ? 'active' : ''}>Animation</button>
        <button onClick={() => handleChangeMode('sandbox')} className={currentMode === 'sandbox' ? 'active' : ''}>Toys</button>
      </div>

      {statusDraw && <div className={`status-message ${statusDraw.isError ? 'error' : 'success'}`}>{statusDraw.message}</div>}

      <div className="module-container">
        <h2>Real-time Display Preview</h2>
        <PixelGridPreview refreshInterval={1000/20} previewSize="small" />
      </div>

      {(currentMode === 'draw' || currentMode === 'animation') && (
        <div className="module-container">
          <h1>Pixel Grid</h1>
          <PixelGridCanvas
            gridData={pixelGrid}
            onGridChange={handleGridChange}
            isAutomationActive={!!activeAutomation}
            onInteraction={handlePixelGridInteraction}
          />
          <div className="controls">
            <button onClick={handleSendToVRC}>Send to VRC</button>
            <button onClick={handleClearGrid} className="btn-danger">Clear Grid & Send</button>
          </div>
        </div>
      )}

      {currentMode === 'draw' && (
        <DrawingPresetsManager
          currentGrid={pixelGrid}
          onPresetLoad={async (loadedGrid) => { await handleStopAllAutomations(true); setPixelGrid(loadedGrid); await handleGridChange(loadedGrid); displayStatus(setStatusDraw, "Preset loaded."); }}
          displayStatus={(msg, isErr) => displayStatus(setStatusDraw, msg, isErr)}
          onInteraction={async () => { await handleStopAllAutomations(true); }} />
      )}
      {currentMode === 'scroll' && (
        <ScrollTextManager onStartScroll={async () => await handleAutomationStart('scroll')} onStopScroll={async () => await handleStopAllAutomations(true)} displayStatus={(msg, isErr) => displayStatus(setStatusDraw, msg, isErr)} />
      )}
      {currentMode === 'sandbox' && (
        <SandboxesManager onStartPlaying={async () => await handleAutomationStart('sandbox')} onStopPlaying={async () => await handleStopAllAutomations(true)} displayStatus={(msg, isErr) => displayStatus(setStatusDraw, msg, isErr)} />
      )}
      {currentMode === 'animation' && (
        <AnimationManager initialFrames={pixelGrid} gridSize={GRID_SIZE} onPlayAnimation={async (frames, delay) => { await handleAutomationStart('animation');}} onStopAnimation={async () => await handleStopAllAutomations(true)} onLoadAnimationFrames={handleAnimationManagerRequestsDisplayFrame} displayStatus={(msg, isErr) => displayStatus(setStatusDraw, msg, isErr)} />
      )}
    </main>
  );
}

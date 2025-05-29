// app/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import PixelGridCanvas from './components/PixelGridCanvas';
import DrawingPresetsManager from './components/DrawingPresetsManager';
import ScrollTextManager from './components/ScrollTextManager';
import AnimationManager from './components/AnimationManager';
import { GRID_SIZE } from './lib/font';

export default function HomePage() {
  const [pixelGrid, setPixelGrid] = useState<boolean[][]>(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
  const [statusDraw, setStatusDraw] = useState<{ message: string, isError: boolean } | null>(null);
  const [activeAutomation, setActiveAutomation] = useState<string | null>(null);

  const displayStatus = useCallback((setter: React.Dispatch<React.SetStateAction<{ message: string, isError: boolean } | null>>, message: string, isError = false) => {
    setter({ message, isError }); setTimeout(() => setter(null), 3000);
  }, []);

  const fetchGrid = useCallback(async (calledByAutomationStop = false) => {
    try {
      const response = await fetch('/api/grid'); const data = await response.json();
      if (data.grid) {
        if (!activeAutomation || calledByAutomationStop) { // Only update main canvas if no automation is running or it just stopped
            setPixelGrid(data.grid);
        }
      }
    } catch (error) { displayStatus(setStatusDraw, 'Error fetching grid state.', true); }
  }, [setStatusDraw, activeAutomation]);

  useEffect(() => { fetchGrid(); }, [fetchGrid]);

  const handleGridChange = useCallback(async (newGrid: boolean[][]) => {
    setPixelGrid(newGrid);
    if (!activeAutomation) {
        try {
            await fetch('/api/grid', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newGrid }), });
        } catch (error) { displayStatus(setStatusDraw, 'Error saving drawing to server.', true); }
    }
  }, [activeAutomation, setStatusDraw]);

  const handleStopAllAutomations = useCallback(async (tellServer: boolean = true) => {
    let wasActive = activeAutomation;
    if (tellServer) {
        if (activeAutomation === 'scroll') await fetch('/api/scrolltext/stop', { method: 'POST' });
        if (activeAutomation === 'animation') await fetch('/api/animations/stop', { method: 'POST' });
    }
    setActiveAutomation(null);
    if (wasActive) await fetchGrid(true); // Fetch grid state after stopping an automation
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
  
  const handleAutomationStart = async (type: 'scroll' | 'animation') => {
    if (activeAutomation && activeAutomation !== type) await handleStopAllAutomations(true);
    setActiveAutomation(type);
  };

  return (
    <main className="main-column">
      <div className="module-container">
        <h1>Pixel Grid</h1>
        <PixelGridCanvas gridData={pixelGrid} onGridChange={handleGridChange} isAutomationActive={!!activeAutomation} onInteraction={() => handleStopAllAutomations(true)} />
        <div className="controls"> <button onClick={handleSendToVRC}>Send to VRC</button> <button onClick={handleClearGrid} className="btn-danger">Clear Grid & Send</button> </div>
        {statusDraw && <div className={`status ${statusDraw.isError ? 'error' : 'success'}`}>{statusDraw.message}</div>}
      </div>
      <DrawingPresetsManager currentGrid={pixelGrid} onPresetLoad={(loadedGrid) => { handleStopAllAutomations(true); setPixelGrid(loadedGrid); handleGridChange(loadedGrid); }} displayStatus={(msg, isErr) => displayStatus(setStatusDraw, msg, isErr)} onInteraction={() => handleStopAllAutomations(true)} />
      <ScrollTextManager onStartScroll={() => handleAutomationStart('scroll')} onStopScroll={() => handleStopAllAutomations(true)} displayStatus={(msg, isErr) => displayStatus(setStatusDraw, msg, isErr)} />
      <AnimationManager initialFrames={pixelGrid} gridSize={GRID_SIZE} onPlayAnimation={async (frames, delay) => { await handleAutomationStart('animation');}} onStopAnimation={() => handleStopAllAutomations(true)} onLoadAnimationFrames={(frames) => {setPixelGrid(frames[0] || Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));}} displayStatus={(msg, isErr) => displayStatus(setStatusDraw, msg, isErr)} />
    </main>
  );
}
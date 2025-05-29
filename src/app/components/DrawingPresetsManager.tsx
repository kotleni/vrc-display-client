// app/components/DrawingPresetsManager.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
interface DrawingPresetsManagerProps { currentGrid: boolean[][]; onPresetLoad: (loadedGrid: boolean[][]) => void; displayStatus: (message: string, isError?: boolean) => void; onInteraction: () => void;}
const DrawingPresetsManager: React.FC<DrawingPresetsManagerProps> = ({ currentGrid, onPresetLoad, displayStatus, onInteraction }) => {
  const [presetName, setPresetName] = useState('');
  const [presets, setPresets] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('');

  const fetchPresets = useCallback(async () => {
    try {
      const response = await fetch('/api/presets'); const data = await response.json();
      if (data.success && data.presets) setPresets(data.presets);
      else displayStatus(data.message || "Could not fetch presets.", true);
    } catch (error) { displayStatus('Error fetching presets.', true); }
  }, [displayStatus]);

  useEffect(() => { fetchPresets(); }, [fetchPresets]);

  const handleSavePreset = async () => {
    if (!presetName) { displayStatus('Preset name cannot be empty.', true); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(presetName)) { displayStatus('Preset name invalid characters.', true); return; }
    onInteraction();
    try {
      const response = await fetch('/api/presets/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: presetName, grid: currentGrid }) });
      const data = await response.json(); displayStatus(data.message, !data.success);
      if (data.success) { fetchPresets(); setPresetName(''); }
    } catch (error) { displayStatus('Error saving preset.', true); }
  };

  const handleLoadPreset = async () => {
    if (!selectedPreset) { displayStatus('Please select a preset to load.', true); return; }
    onInteraction();
    try {
      const response = await fetch(`/api/presets/load/${selectedPreset}`); const data = await response.json();
      displayStatus(data.message, !data.success);
      if (data.success && data.grid) onPresetLoad(data.grid);
    } catch (error) { displayStatus('Error loading preset.', true); }
  };

  return (
    <div className="module-container">
      <h2>Drawing Presets</h2>
      <div className="control-group">
        <label htmlFor="presetNameIn">Name:</label>
        <input type="text" id="presetNameIn" placeholder="Preset Name" value={presetName} onChange={(e) => setPresetName(e.target.value)} />
        <button onClick={handleSavePreset} className="btn-warning">Save Current</button>
      </div>
      <div className="control-group">
        <label htmlFor="presetSelectIn">Load:</label>
        <select id="presetSelectIn" value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)}>
          <option value="">--Select Preset--</option>
          {presets.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <button onClick={handleLoadPreset}>Load</button>
      </div>
    </div>
  );
};
export default DrawingPresetsManager;
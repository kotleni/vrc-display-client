'use client';
import React, {useCallback, useEffect, useState} from 'react';
import {SandboxToyMeta} from "@/app/lib/toysService";

interface ScrollTextManagerProps {
    onStartPlaying: () => void;
    onStopPlaying: () => void;
    displayStatus: (message: string, isError?: boolean) => void;
}

const SandboxesManager: React.FC<ScrollTextManagerProps> = ({ onStartPlaying, onStopPlaying, displayStatus }) => {
    const [sandboxes, setSandboxes] = useState<SandboxToyMeta[]>();
    const [selectedToy, setSelectedToy] = useState<SandboxToyMeta>();

    const fetchPresets = useCallback(async () => {
        try {
            const response = await fetch('/api/sandbox'); const data = await response.json();
            if (data.success && data.toys) setSandboxes(data.toys);
            else displayStatus(data.message || "Could not fetch presets.", true);
        } catch (error) { displayStatus('Error fetching presets.', true); }
    }, []);

    useEffect(() => { fetchPresets(); }, [fetchPresets]);

    const handleStartToy = async () => {
        if (!selectedToy) { displayStatus('Please enter text to scroll.', true); return; }
        onStartPlaying();
        try {
            const response = await fetch('/api/sandbox/play', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedToy.id }) });
            const data = await response.json(); displayStatus(data.message, !data.success);
            if (!data.success) onStopPlaying(); // If server fails to start, ensure client state matches
        } catch (error) { displayStatus('Error playing toy.', true); onStopPlaying(); }
    };

    const handleStopToy = async () => {
        onStopPlaying();
        try {
            const response = await fetch('/api/sandbox/stop', { method: 'POST' });
            const data = await response.json(); displayStatus(data.message, !data.success);
        } catch (error) { displayStatus('Error stopping toy.', true); }
    };

    return (
        <div className="module-container">
            <h2>Toys</h2>
            <select id="presetSelectIn" value={selectedToy?.id} onChange={(e) => setSelectedToy(sandboxes?.find(toy => toy.id === e.target.value))}>
                <option value="">--Select Preset--</option>
                {sandboxes?.map(toyMeta => <option key={toyMeta.id} value={toyMeta.id}>{toyMeta.name}</option>)}
            </select>
            <div className="controls">
                <button onClick={handleStartToy}>Start toy</button>
                <button onClick={handleStopToy} className="btn-danger">Stop toy</button>
            </div>
        </div>
    );
};
export default SandboxesManager;
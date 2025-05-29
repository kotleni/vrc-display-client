'use client';
import React, { useState, useEffect, useRef } from 'react';
import { GRID_SIZE } from '@/app/lib/font'; // Adjust path

interface PixelGridCanvasProps {
  gridData: boolean[][];
  onGridChange: (newGrid: boolean[][]) => void;
  isAutomationActive: boolean;
  onInteraction: () => void; // Callback when user interacts with the grid
}

const PixelGridCanvas: React.FC<PixelGridCanvasProps> = ({ gridData, onGridChange, isAutomationActive, onInteraction }) => {
  const [internalGrid, setInternalGrid] = useState<boolean[][]>(gridData);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [currentDrawMode, setCurrentDrawMode] = useState<boolean | null>(null); // true for drawing 'on', false for 'off'
  const gridContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInternalGrid(gridData);
  }, [gridData]);

  const handleCellInteraction = (y: number, x: number, isClick: boolean) => {
    if (isAutomationActive && isClick) { // Only call onInteraction if automation is active and it's a direct click
        onInteraction(); // Signal to stop automation
        // After automation stops, subsequent drags should work on the now static grid
    }
    
    const newGrid = internalGrid.map(row => [...row]);
    let newCellValue: boolean;

    if (isClick) { // For single click or start of drag
        newCellValue = !newGrid[y][x];
        setCurrentDrawMode(newCellValue); // Set draw mode based on the first cell clicked in a sequence
    } else { // For drag
        if (currentDrawMode === null) return; // Should not happen if mousedown sets it
        newCellValue = currentDrawMode;
    }
    
    if (newGrid[y][x] !== newCellValue) {
        newGrid[y][x] = newCellValue;
        setInternalGrid(newGrid);
        if (!isMouseDown || isClick) { // Update parent immediately on click or after drag ends
            onGridChange(newGrid);
        }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, y: number, x: number) => {
    e.preventDefault();
    if(e.button !== 0) return; // Only left click
    setIsMouseDown(true);
    gridContainerRef.current?.setPointerCapture(e.pointerId);
    handleCellInteraction(y, x, true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>, y: number, x: number) => {
    if (isMouseDown) {
      handleCellInteraction(y, x, false);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMouseDown) {
        setIsMouseDown(false);
        gridContainerRef.current?.releasePointerCapture(e.pointerId);
        setCurrentDrawMode(null);
        onGridChange(internalGrid); // Send final state after drag
    }
  };
  
  // Global pointer up listener to catch cases where mouse is released outside the grid
    useEffect(() => {
        const handleGlobalPointerUp = () => {
            if (isMouseDown) {
                setIsMouseDown(false);
                setCurrentDrawMode(null);
                onGridChange(internalGrid);
            }
        };
        window.addEventListener('pointerup', handleGlobalPointerUp);
        return () => {
            window.removeEventListener('pointerup', handleGlobalPointerUp);
        };
    }, [isMouseDown, internalGrid, onGridChange]);


  return (
    <div
      ref={gridContainerRef}
      className="grid-container"
      onContextMenu={(e) => e.preventDefault()}
    >
      {internalGrid.map((row, y) =>
        row.map((cellState, x) => (
          <div
            key={`${y}-${x}`}
            className={`grid-cell ${cellState ? 'on' : ''}`}
            onPointerDown={(e) => handlePointerDown(e, y, x)}
            onPointerEnter={(e) => { // Changed from onPointerMove for better cell detection
                if(isMouseDown) handlePointerMove(e, y, x);
            }}
          />
        ))
      )}
    </div>
  );
};

export default PixelGridCanvas;
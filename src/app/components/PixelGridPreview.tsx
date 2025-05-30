'use client';
import React, { useState, useEffect } from 'react';
import { GRID_SIZE } from '@/app/lib/font';

interface PixelGridPreviewProps {
  refreshInterval?: number; // in milliseconds, default will be 1000ms (1 second)
  previewSize?: 'small' | 'medium' | 'large'; // size of the preview
}

const PixelGridPreview: React.FC<PixelGridPreviewProps> = ({ 
  refreshInterval = 1000,
  previewSize = 'medium'
}) => {
  const [gridData, setGridData] = useState<boolean[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  );

  // Fetch the current grid state from the server
  const fetchGridData = async () => {
    try {
      const response = await fetch('/api/grid');
      const data = await response.json();
      if (data.grid) {
        setGridData(data.grid);
      }
    } catch (error) {
      console.error('Error fetching grid data:', error);
    }
  };

  // Fetch grid data on component mount and at regular intervals
  useEffect(() => {
    // Initial fetch
    fetchGridData();

    // Set up interval for regular updates
    const intervalId = setInterval(fetchGridData, refreshInterval);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  // Determine CSS class based on previewSize prop
  const sizeClass = `preview-${previewSize}`;

  return (
    <div className={`pixel-grid-preview ${sizeClass}`}>
      <h3>Real-time Preview</h3>
      <div className="preview-grid-container">
        {gridData.map((row, y) =>
          row.map((cellState, x) => (
            <div
              key={`${y}-${x}`}
              className={`preview-grid-cell ${cellState ? 'on' : ''}`}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PixelGridPreview;
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Columns, SplitSquareVertical } from 'lucide-react';

export default function CompareSlider({
  originalUrl,
  enhancedUrl,
  originalLabel = "Low-Light Original",
  enhancedLabel = "Night Vision Enhanced",
  alt = "Comparison"
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' or 'side-by-side'
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button
          className={`btn btn-secondary ${viewMode === 'slider' ? 'btn-primary' : ''}`}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          onClick={() => setViewMode('slider')}
        >
          <SplitSquareVertical size={14} /> Split Slider
        </button>
        <button
          className={`btn btn-secondary ${viewMode === 'side-by-side' ? 'btn-primary' : ''}`}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          onClick={() => setViewMode('side-by-side')}
        >
          <Columns size={14} /> Side-by-Side
        </button>
      </div>

      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          className="compare-container"
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          {/* Enhanced image (background layer) */}
          <img src={enhancedUrl} alt={enhancedLabel} className="compare-image" />
          <span className="compare-label compare-label-after">{enhancedLabel}</span>

          {/* Original image (clipped top layer) */}
          <div
            className="compare-overlay"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={originalUrl}
              alt={originalLabel}
              className="compare-image"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                maxWidth: 'none'
              }}
            />
            <span className="compare-label compare-label-before">{originalLabel}</span>
          </div>

          {/* Draggable divider line */}
          <div
            className="compare-slider-line"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="compare-slider-handle">
              <SplitSquareVertical size={18} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          <div className="glass-card" style={{ padding: '0.75rem', position: 'relative' }}>
            <span className="compare-label compare-label-before" style={{ top: '1.25rem', left: '1.25rem' }}>
              {originalLabel}
            </span>
            <img
              src={originalUrl}
              alt={originalLabel}
              style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-md)', display: 'block' }}
            />
          </div>
          <div className="glass-card" style={{ padding: '0.75rem', position: 'relative' }}>
            <span className="compare-label compare-label-after" style={{ top: '1.25rem', right: '1.25rem' }}>
              {enhancedLabel}
            </span>
            <img
              src={enhancedUrl}
              alt={enhancedLabel}
              style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-md)', display: 'block' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

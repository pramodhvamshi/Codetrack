import React, { useState, useEffect, useRef } from 'react';
import RoadmapNode from './RoadmapNode';
import ConnectionLayer from './ConnectionLayer';
import { ZoomIn, ZoomOut, Maximize2, Search, Eye, EyeOff } from 'lucide-react';

const RoadmapCanvas = ({ nodes, edges, progress, onNodeClick, selectedNodeId }) => {
  const canvasRef = useRef(null);

  // Zoom and Pan State
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filters & Highlights State
  const [searchQuery, setSearchQuery] = useState('');
  const [showOptional, setShowOptional] = useState(true);

  // Compute maximum dimensions for absolute canvas wrapper scrolling
  const maxX = Math.max(800, ...nodes.map(n => (n.x || 0) + (n.width || 220) + 100));
  const maxY = Math.max(600, ...nodes.map(n => (n.y || 0) + (n.height || 60) + 150));

  // Handle Panning via dragging on canvas background
  const handleMouseDown = (e) => {
    // Only drag when clicking background
    if (e.target.classList.contains('canvas-background') || e.target.classList.contains('connections-svg')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (factor) => {
    setScale(prev => Math.max(0.4, Math.min(2, prev * factor)));
  };

  const handleResetZoom = () => {
    setScale(1);
    setPanOffset({ x: 50, y: 50 });
  };

  // Node filtering
  const visibleNodes = nodes.filter(node => {
    if (!showOptional && node.isOptional) return false;
    return true;
  });

  const visibleNodeIds = new Set(visibleNodes.map(n => n._id.toString()));

  // Filter edges based on visible nodes
  const visibleEdges = (edges || []).filter(edge => {
    // Check if both source and target correspond to visible nodes
    return visibleNodeIds.has(edge.sourceNodeId) && visibleNodeIds.has(edge.targetNodeId);
  });

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden', 
        userSelect: 'none',
        backgroundColor: '#0b0f19', // Dark canvas background
        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.06) 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
        borderRadius: '12px',
        border: '1px solid var(--border)'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="canvas-background"
    >
      {/* FLOATABLE TOOLBAR PANEL */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '1rem', 
          left: '1rem', 
          zIndex: 100, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          background: 'rgba(15, 23, 42, 0.8)', 
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '0.5rem 1rem', 
          borderRadius: '8px'
        }}
      >
        <button onClick={() => handleZoom(1.15)} className="ct-button-secondary" style={{ padding: '0.4rem', border: 'none' }} title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <button onClick={() => handleZoom(0.85)} className="ct-button-secondary" style={{ padding: '0.4rem', border: 'none' }} title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        <button onClick={handleResetZoom} className="ct-button-secondary" style={{ padding: '0.4rem', border: 'none' }} title="Reset Viewport">
          <Maximize2 size={15} />
        </button>
        
        <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>

        {/* Optional toggles */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#9ca3af', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
          <input 
            type="checkbox" 
            checked={showOptional} 
            onChange={(e) => setShowOptional(e.target.checked)} 
            style={{ accentColor: 'var(--accent-blue)', width: '14px', height: '14px' }} 
          />
          {showOptional ? <Eye size={14} /> : <EyeOff size={14} />} Optional Nodes
        </label>

        <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>

        {/* Live Search bar inside toolbar */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} color="#6b7280" style={{ position: 'absolute', left: '0.5rem' }} />
          <input 
            type="text" 
            placeholder="Search topic..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              background: '#090d16', 
              border: '1px solid rgba(255,255,255,0.06)', 
              borderRadius: '4px', 
              padding: '0.25rem 0.5rem 0.25rem 1.75rem', 
              fontSize: '0.75rem', 
              width: '130px',
              color: 'white',
              outline: 'none'
            }} 
          />
        </div>
      </div>

      {/* GRAPH CANVAS TRANSFORMED CONTAINER */}
      <div 
        ref={canvasRef}
        style={{ 
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`, 
          transformOrigin: '0 0', 
          position: 'absolute', 
          width: `${maxX}px`, 
          height: `${maxY}px`,
          pointerEvents: 'none',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {/* SVG CONNECTIONS (EDGES) LAYER */}
        <ConnectionLayer edges={visibleEdges} nodes={visibleNodes} progress={progress} />

        {/* ABSOLUTE RENDERING NODES LAYER */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}>
          {visibleNodes.map((node) => {
            const status = progress[node._id] || 'Pending';
            const isSelected = selectedNodeId === node._id;

            // Highlight matches
            const isMatch = searchQuery && node.title.toLowerCase().includes(searchQuery.toLowerCase());

            return (
              <div 
                key={node._id} 
                style={{ 
                  position: 'absolute', 
                  left: `${node.x}px`, 
                  top: `${node.y}px`, 
                  width: `${node.width || 220}px`, 
                  height: `${node.height || 60}px`,
                  zIndex: isSelected ? 20 : 10
                }}
              >
                <RoadmapNode
                  node={node}
                  status={status}
                  isSelected={isSelected}
                  isHighlighted={!!isMatch}
                  onClick={() => onNodeClick(node)}
                />
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};

export default RoadmapCanvas;

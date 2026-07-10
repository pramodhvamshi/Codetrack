import React from 'react';

const ConnectionLayer = ({ edges, nodes, progress }) => {
  const nodeMap = new Map(nodes.map(n => [n._id.toString(), n]));

  const getLineColor = (status) => {
    switch (status) {
      case 'Done':
        return 'var(--success)';
      case 'In Progress':
        return 'var(--warning)';
      case 'Bookmarked':
        return 'var(--primary)';
      case 'Skip':
        return 'rgba(255,255,255,0.15)';
      default:
        return 'rgba(255,255,255,0.08)';
    }
  };

  return (
    <svg 
      className="connections-svg"
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        zIndex: 5 
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="rgba(255,255,255,0.15)" />
        </marker>
      </defs>

      {edges.map((edge, idx) => {
        const sourceNode = nodeMap.get(edge.sourceNodeId);
        const targetNode = nodeMap.get(edge.targetNodeId);

        if (!sourceNode || !targetNode) return null;

        const sw = sourceNode.width || 220;
        const sh = sourceNode.height || 60;
        const tw = targetNode.width || 220;
        const th = targetNode.height || 60;

        let fromX, fromY, toX, toY;

        // Choose connection ports dynamically based on relative node positions
        if (targetNode.y >= sourceNode.y + sh) {
          // Flowing downwards
          fromX = sourceNode.x + sw / 2;
          fromY = sourceNode.y + sh;
          toX = targetNode.x + tw / 2;
          toY = targetNode.y;
        } else if (targetNode.x >= sourceNode.x + sw) {
          // Flowing rightwards
          fromX = sourceNode.x + sw;
          fromY = sourceNode.y + sh / 2;
          toX = targetNode.x;
          toY = targetNode.y + th / 2;
        } else if (sourceNode.x >= targetNode.x + tw) {
          // Flowing leftwards
          fromX = sourceNode.x;
          fromY = sourceNode.y + sh / 2;
          toX = targetNode.x + tw;
          toY = targetNode.y + th / 2;
        } else {
          // Centered or overlaying
          fromX = sourceNode.x + sw / 2;
          fromY = sourceNode.y + sh / 2;
          toX = targetNode.x + tw / 2;
          toY = targetNode.y + th / 2;
        }

        const dy = toY - fromY;
        const cp1y = fromY + dy * 0.5;
        const cp2y = toY - dy * 0.5;
        
        // Draw S-bezier curve
        const pathD = `M ${fromX} ${fromY} C ${fromX} ${cp1y}, ${toX} ${cp2y}, ${toX} ${toY}`;

        // Color based on target node completion status
        const targetStatus = progress[targetNode._id] || 'Pending';
        const color = getLineColor(targetStatus);
        const isDashed = edge.style === 'dashed' || targetStatus === 'Pending' || targetStatus === 'Skip';

        return (
          <path
            key={edge._id || idx}
            d={pathD}
            stroke={color}
            strokeWidth={isDashed ? "1.5" : "2"}
            strokeDasharray={isDashed ? "4,4" : "none"}
            fill="none"
            markerEnd="url(#arrowhead)"
            style={{ transition: 'stroke 0.3s ease' }}
          />
        );
      })}
    </svg>
  );
};

export default ConnectionLayer;

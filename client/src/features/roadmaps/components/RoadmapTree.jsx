import React from 'react';
import RoadmapNode from './RoadmapNode';

const RoadmapTree = ({ nodes, progress, onNodeClick, selectedNodeId }) => {
  // A simplistic vertical tree rendering.
  // In a real roadmap.sh clone, nodes alternate left/right along a central spine.
  return (
    <div className="roadmap-tree-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      {nodes.map((node) => {
        const nodeProgress = progress[node._id] || 'Pending';
        const isSelected = selectedNodeId === node._id;
        
        return (
          <RoadmapNode
            key={node._id}
            node={node}
            status={nodeProgress}
            isSelected={isSelected}
            onClick={() => onNodeClick(node)}
          />
        );
      })}
    </div>
  );
};

export default RoadmapTree;

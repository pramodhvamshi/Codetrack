import React, { useMemo } from 'react';
import TreeNode from './TreeNode';

const buildTree = (nodes) => {
  const nodeMap = new Map();
  nodes.forEach(node => {
    nodeMap.set(node._id.toString(), { ...node, children: [] });
  });

  const roots = [];
  nodeMap.forEach(node => {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId.toString());
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node); // Fallback if parent missing
      }
    } else {
      roots.push(node);
    }
  });
  
  // Sort by order
  const sortNodes = (nodeList) => {
    nodeList.sort((a, b) => a.order - b.order);
    nodeList.forEach(n => sortNodes(n.children));
  };
  sortNodes(roots);
  
  return roots;
};

const LearningTree = ({ nodes, progress, onNodeClick, selectedNodeId }) => {
  const treeRoots = useMemo(() => buildTree(nodes), [nodes]);

  if (nodes.length === 0) {
    return <div style={{ color: 'var(--text-muted)' }}>No curriculum data available.</div>;
  }

  return (
    <div style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {treeRoots.map(rootNode => (
        <TreeNode 
          key={rootNode._id} 
          node={rootNode} 
          progress={progress} 
          onNodeClick={onNodeClick}
          selectedNodeId={selectedNodeId}
          isRoot={true}
        />
      ))}
    </div>
  );
};

export default LearningTree;

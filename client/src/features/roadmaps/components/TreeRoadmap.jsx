import React, { useMemo } from 'react';
import RoadmapSection from './RoadmapSection';

const buildRoadmapSections = (nodes) => {
  if (!nodes || nodes.length === 0) return [];

  // Group nodes by parent
  const nodeMap = new Map();
  nodes.forEach((n) => nodeMap.set(n._id.toString(), { ...n, children: [] }));

  const rootMilestones = [];

  nodeMap.forEach((n) => {
    if (n.parentId) {
      const parent = nodeMap.get(n.parentId.toString());
      if (parent) {
        parent.children.push(n);
      }
    } else {
      rootMilestones.push(n);
    }
  });

  rootMilestones.sort((a, b) => (a.order || 0) - (b.order || 0));

  if (rootMilestones.length > 0) {
    return rootMilestones.map((milestone) => {
      const children = milestone.children.sort((a, b) => (a.order || 0) - (b.order || 0));

      const leftTopics = [];
      const rightTopics = [];

      children.forEach((child, index) => {
        if (child.branch === 'left') {
          leftTopics.push(child);
        } else if (child.branch === 'right') {
          rightTopics.push(child);
        } else {
          if (index % 2 === 0) {
            leftTopics.push(child);
          } else {
            rightTopics.push(child);
          }
        }
      });

      return {
        milestone,
        leftTopics,
        rightTopics
      };
    });
  }

  return [];
};

export const TreeRoadmap = ({ nodes = [], progress = {}, onNodeClick }) => {
  const sections = useMemo(() => buildRoadmapSections(nodes), [nodes]);

  if (nodes.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        No roadmap tree data available.
      </div>
    );
  }

  return (
    <div className="ct-tree-container">
      {/* Central timeline axis */}
      <div className="ct-tree-axis" />

      <div className="ct-tree-flex">
        {sections.map((section, idx) => (
          <RoadmapSection
            key={section.milestone._id || idx}
            section={section}
            progress={progress}
            onNodeClick={onNodeClick}
          />
        ))}
      </div>
    </div>
  );
};

export default TreeRoadmap;

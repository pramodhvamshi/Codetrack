import React from 'react';
import MilestoneNode from './MilestoneNode';
import LeftBranch from './LeftBranch';
import RightBranch from './RightBranch';

export const RoadmapSection = ({ section, progress = {}, onNodeClick }) => {
  const { milestone, leftTopics = [], rightTopics = [] } = section;

  const allTopics = [...leftTopics, ...rightTopics];
  const isCompleted = allTopics.length > 0 && allTopics.every((t) => {
    const tId = t._id ? t._id.toString() : '';
    return progress[t._id] === 'Done' || (tId && progress[tId] === 'Done');
  });

  return (
    <div className="ct-tree-section-row">
      <LeftBranch
        topics={leftTopics}
        progress={progress}
        onNodeClick={onNodeClick}
      />

      <MilestoneNode
        milestone={milestone}
        isCompleted={isCompleted}
      />

      <RightBranch
        topics={rightTopics}
        progress={progress}
        onNodeClick={onNodeClick}
      />
    </div>
  );
};

export default RoadmapSection;

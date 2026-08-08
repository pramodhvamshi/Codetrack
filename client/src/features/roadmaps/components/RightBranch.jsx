import React from 'react';
import TopicCard from './TopicCard';

export const RightBranch = ({ topics, progress = {}, onNodeClick }) => {
  if (!topics || topics.length === 0) return <div className="ct-right-col" />;

  return (
    <div className="ct-right-col">
      <div className="ct-right-line-vertical" />
      <div className="ct-right-line-horizontal" />
      <div className="ct-right-line-bottom" />

      {topics.map((topic) => {
        const topicId = topic._id ? topic._id.toString() : '';
        const status = progress[topic._id] || (topicId && progress[topicId]);

        return (
          <div key={topic._id || topic.title} style={{ position: 'relative', width: '100%', paddingRight: '4rem' }}>
            <TopicCard
              node={topic}
              status={status}
              onClick={onNodeClick}
            />
          </div>
        );
      })}
    </div>
  );
};

export default RightBranch;

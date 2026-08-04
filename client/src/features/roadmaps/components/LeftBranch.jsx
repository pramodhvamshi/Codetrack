import React from 'react';
import TopicCard from './TopicCard';

export const LeftBranch = ({ topics, progress = {}, onNodeClick }) => {
  if (!topics || topics.length === 0) return <div className="ct-left-col" />;

  return (
    <div className="ct-left-col">
      <div className="ct-left-line-vertical" />
      <div className="ct-left-line-horizontal" />
      <div className="ct-left-line-bottom" />

      {topics.map((topic) => {
        const topicId = topic._id ? topic._id.toString() : '';
        const status = progress[topic._id] || (topicId && progress[topicId]);

        return (
          <div key={topic._id || topic.title} style={{ position: 'relative', width: '100%', paddingLeft: '4rem' }}>
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

export default LeftBranch;

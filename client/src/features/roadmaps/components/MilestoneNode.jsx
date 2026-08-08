import React from 'react';

export const MilestoneNode = ({ milestone, isCompleted }) => {
  return (
    <div className="ct-center-col">
      <button
        type="button"
        aria-label={`Milestone: ${milestone.title}`}
        className={`ct-milestone-btn ${isCompleted ? 'completed' : ''}`}
      >
        <span>{milestone.title}</span>
      </button>
    </div>
  );
};

export default MilestoneNode;

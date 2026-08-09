import React from 'react';

export function ProgrammeStatusBadge({ status, statusLabel }) {
  let badgeClass = 'mct-status-badge ';
  
  if (status === 'AVAILABLE') {
    badgeClass += 'mct-status-AVAILABLE';
  } else if (status === 'COMING_SOON') {
    badgeClass += 'mct-status-COMING_SOON';
  } else {
    badgeClass += 'mct-status-WORK_IN_PROGRESS';
  }

  return (
    <span className={badgeClass}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: 'currentColor',
        display: 'inline-block'
      }} />
      {statusLabel || (status === 'AVAILABLE' ? 'DIGITAL PLATFORM AVAILABLE' : status === 'COMING_SOON' ? 'DIGITAL EXPERIENCE COMING SOON' : 'DIGITAL EXPERIENCE WORK IN PROGRESS')}
    </span>
  );
}

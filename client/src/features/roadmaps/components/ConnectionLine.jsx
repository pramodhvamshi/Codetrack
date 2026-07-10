import React from 'react';

const ConnectionLine = () => {
  return (
    <div style={{
      position: 'absolute',
      left: '1.5rem',
      top: 0,
      bottom: '1.5rem',
      width: '1px',
      backgroundColor: 'var(--border)',
      zIndex: 1
    }} />
  );
};

export default ConnectionLine;

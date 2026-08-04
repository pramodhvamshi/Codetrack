import React from 'react';

export const RoadmapBrandIcon = ({ title, size = 28 }) => {
  const t = (title || '').toLowerCase();
  const iconStyle = { width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` };

  if (t.includes('java') && !t.includes('script')) {
    // Java Coffee Cup Logo
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 19c2 1 6 1 8 0M3 16c3 1 9 1 12 0M6 13c2.5.5 7.5.5 10 0" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 9V6c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3c0 3 2 5 5 5h0c3 0 5-2 5-5z" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1.5" />
        <path d="M15 7h2c1.1 0 2 .9 2 2s-.9 2-2 2h-2" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (t.includes('python')) {
    // Python Snakes Logo
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.9 2c-3.1 0-5 1.5-5 3.5V7.2h5.1v.7H4.3C2.5 7.9 1 9.4 1 12.2c0 2.9 1.5 4.3 3.3 4.3h2v-2.4c0-2.2 1.9-4.1 4.1-4.1h5.1c1.9 0 3.5-1.6 3.5-3.5V5.5c0-2-1.6-3.5-5.1-3.5h-2zm-1.7 1.8c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9z" fill="#38bdf8" />
        <path d="M12.1 22c3.1 0 5-1.5 5-3.5v-1.7h-5.1v-.7h7.7c1.8 0 3.3-1.5 3.3-4.3 0-2.9-1.5-4.3-3.3-4.3h-2v2.4c0 2.2-1.9 4.1-4.1 4.1H8.6c-1.9 0-3.5 1.6-3.5 3.5v1.0c0 2 1.6 3.5 5.1 3.5h1.9zm1.7-1.8c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9-.4.9-.9.9z" fill="#facc15" />
      </svg>
    );
  }

  if (t.includes('c++') || t.includes('cpp')) {
    // C++ Logo Badge
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="#0284c7" fillOpacity="0.2" stroke="#0284c7" strokeWidth="1.5" />
        <text x="6" y="15" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="sans-serif">C++</text>
      </svg>
    );
  }

  if (t.includes('javascript') || t.includes('js')) {
    // JS Yellow Badge Logo
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#facc15" />
        <text x="7" y="17" fill="#000000" fontSize="11" fontWeight="bold" fontFamily="sans-serif">JS</text>
      </svg>
    );
  }

  if (t.includes('go') && !t.includes('algo')) {
    // Go Gopher Cyan Logo
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="16" rx="8" fill="#06b6d4" fillOpacity="0.2" stroke="#06b6d4" strokeWidth="1.5" />
        <circle cx="8" cy="11" r="2" fill="#22d3ee" />
        <circle cx="16" cy="11" r="2" fill="#22d3ee" />
        <path d="M10 15c1 1 3 1 4 0" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (t.includes('sql') || t.includes('database') || t.includes('dbms')) {
    // SQL Database Cylinder Logo
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="12" cy="5" rx="8" ry="3" fill="#3b82f6" fillOpacity="0.3" stroke="#60a5fa" strokeWidth="1.5" />
        <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" stroke="#60a5fa" strokeWidth="1.5" />
        <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke="#60a5fa" strokeWidth="1.5" />
      </svg>
    );
  }

  if (t.includes('git')) {
    // Git Orange Branch Logo
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="4" transform="rotate(45 12 12)" fill="#f97316" />
        <circle cx="10" cy="9" r="2" fill="#ffffff" />
        <circle cx="10" cy="15" r="2" fill="#ffffff" />
        <circle cx="15" cy="12" r="2" fill="#ffffff" />
        <path d="M10 11v2M10 12h3" stroke="#ffffff" strokeWidth="1.5" />
      </svg>
    );
  }

  if (t.includes('dsa') || t.includes('data structures') || t.includes('algorithm')) {
    // DSA Tree Nodes Logo
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="4" r="3" fill="#a855f7" />
        <circle cx="6" cy="18" r="3" fill="#c084fc" />
        <circle cx="18" cy="18" r="3" fill="#c084fc" />
        <path d="M12 7L6 15M12 7l6 8" stroke="#c084fc" strokeWidth="1.5" />
      </svg>
    );
  }

  if (t.includes('system design') || t.includes('architecture')) {
    // System Design Grid Logo
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="7" height="7" rx="2" fill="#3b82f6" />
        <rect x="14" y="3" width="7" height="7" rx="2" fill="#3b82f6" />
        <rect x="8.5" y="14" width="7" height="7" rx="2" fill="#60a5fa" />
        <path d="M6.5 10v2h11v-2M12 12v2" stroke="#60a5fa" strokeWidth="1.5" />
      </svg>
    );
  }

  if (t.includes('ai') || t.includes('machine') || t.includes('data science')) {
    // AI Brain Logo
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2a5 5 0 00-5 5c0 .7.1 1.4.4 2A5 5 0 003 14c0 2.2 1.4 4.1 3.4 4.7A5 5 0 0012 22a5 5 0 005.6-3.3A5 5 0 0021 14a5 5 0 00-4.4-5c.3-.6.4-1.3.4-2a5 5 0 00-5-5z" fill="#ec4899" fillOpacity="0.2" stroke="#f472b6" strokeWidth="1.5" />
        <circle cx="9" cy="9" r="1.5" fill="#f472b6" />
        <circle cx="15" cy="9" r="1.5" fill="#f472b6" />
        <circle cx="12" cy="15" r="1.5" fill="#f472b6" />
        <path d="M9 9l3 6 3-6" stroke="#f472b6" strokeWidth="1.5" />
      </svg>
    );
  }

  if (t.includes('devops') || t.includes('docker') || t.includes('cloud')) {
    // Cloud / Infinity Gear Logo
    return (
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" fill="#14b8a6" fillOpacity="0.2" stroke="#2dd4bf" strokeWidth="1.5" />
      </svg>
    );
  }

  // Default Code Icon
  return (
    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.5" />
      <path d="M8 10l-3 2 3 2M16 10l3 2-3 2M13 8l-2 8" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default RoadmapBrandIcon;

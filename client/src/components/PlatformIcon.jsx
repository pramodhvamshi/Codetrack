/**
 * PlatformIcon – renders the official small logo for a coding platform.
 *
 * Usage:
 *   <PlatformIcon platform="leetcode" size={20} />
 *   <PlatformIcon platform="codechef" size={24} />
 *   <PlatformIcon platform="gfg"      size={20} />
 *   <PlatformIcon platform="github"   size={20} />
 *
 * `platform` is matched case-insensitively.
 * Falls back to a coloured letter badge if the platform is unknown.
 */

const META = {
  leetcode: {
    src: '/LeetCode_logo_black.png',
    alt: 'LeetCode',
    bg: '#F59E0B',
    label: 'LC',
  },
  codechef: {
    src: '/codechef.svg',
    alt: 'CodeChef',
    bg: '#EF4444',
    label: 'CC',
  },
  gfg: {
    src: '/gfg.svg',
    alt: 'GeeksforGeeks',
    bg: '#22C55E',
    label: 'GFG',
  },
  geeksforgeeks: {
    src: '/gfg.svg',
    alt: 'GeeksforGeeks',
    bg: '#22C55E',
    label: 'GFG',
  },
  github: {
    src: '/github.svg',
    alt: 'GitHub',
    bg: '#8B5CF6',
    label: 'GH',
  },
  hackerrank: {
    src: '/HackerRank.svg',
    alt: 'HackerRank',
    bg: '#2EC866',
    label: 'HR',
  },
};

export function PlatformIcon({ platform = '', size = 22, style = {}, className = '' }) {
  const key = platform.toLowerCase();
  const meta = META[key];

  const baseStyle = {
    width: size,
    height: size,
    borderRadius: 6,
    objectFit: 'contain',
    flexShrink: 0,
    ...style,
  };

  if (meta) {
    return (
      <img
        src={meta.src}
        alt={meta.alt}
        width={size}
        height={size}
        style={baseStyle}
        className={className}
        onError={(e) => {
          /* If image fails to load, replace with coloured fallback pill */
          e.target.replaceWith(
            Object.assign(document.createElement('span'), {
              textContent: meta.label,
              style: `
                display:inline-flex;align-items:center;justify-content:center;
                width:${size}px;height:${size}px;border-radius:6px;
                background:${meta.bg};color:#fff;font-size:${Math.round(size * 0.38)}px;
                font-weight:700;font-family:monospace;flex-shrink:0;
              `,
            })
          );
        }}
      />
    );
  }

  /* Unknown platform → generic coloured badge */
  const fallbackSize = Math.round(size * 0.4);
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 6,
        background: '#6b7280',
        color: '#fff',
        fontSize: fallbackSize,
        fontWeight: 700,
        fontFamily: 'monospace',
        flexShrink: 0,
        ...style,
      }}
    >
      {platform.slice(0, 2).toUpperCase()}
    </span>
  );
}

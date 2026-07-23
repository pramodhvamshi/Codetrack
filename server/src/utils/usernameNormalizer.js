/**
 * Normalizes platform usernames by stripping URLs, trailing slashes, 
 * leading @ symbols, and spaces.
 */
function normalizePlatformUsername(platform, input) {
  if (!input) return null;
  
  let cleaned = String(input).trim();
  
  // Remove URL prefixes
  if (cleaned.startsWith('http')) {
    try {
      const url = new URL(cleaned);
      const parts = url.pathname.split('/').filter(p => p.length > 0);
      
      if (platform === 'leetcode' && parts[0] === 'u') {
        cleaned = parts[1] || '';
      } else if (platform === 'codechef' && parts[0] === 'users') {
        cleaned = parts[1] || '';
      } else if (platform === 'hackerrank' && parts[0] === 'profile') {
        cleaned = parts[1] || '';
      } else {
        cleaned = parts[parts.length - 1] || '';
      }
    } catch (e) {
      cleaned = cleaned.replace(/^https?:\/\/[^\/]+\/(u\/|users\/|profile\/)?/i, '').replace(/\/$/, '');
    }
  }

  // Remove leading @
  if (cleaned.startsWith('@')) {
    cleaned = cleaned.substring(1);
  }

  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');

  // Remove any spaces
  cleaned = cleaned.replace(/\s+/g, '');

  return cleaned;
}

/**
 * Validates a normalized username.
 * Returns false if it's empty, null, or indicates it's missing (e.g. "NOT AVAILABLE").
 */
function isValidUsername(username) {
  if (!username) return false;
  const upper = username.toUpperCase();
  if (upper === 'NOTAVAILABLE' || upper === 'NA' || upper === 'NULL' || upper === 'NONE') {
    return false;
  }
  return true;
}

module.exports = {
  normalizePlatformUsername,
  isValidUsername
};

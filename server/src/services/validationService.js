const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Validate LeetCode username by querying public GraphQL API
 */
async function validateLeetCode(username) {
  if (!username) return false;
  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
        }
      }
    `;
    const response = await axios.post(
      'https://leetcode.com/graphql',
      { query, variables: { username } },
      {
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }
    );
    if (response.data && response.data.errors) {
      return false;
    }
    return !!response.data?.data?.matchedUser;
  } catch (err) {
    console.error(`LeetCode validation failed for ${username}:`, err.message);
    return false;
  }
}

/**
 * Validate CodeChef username by querying Hades Black API
 */
async function validateCodeChef(username) {
  if (!username) return false;
  try {
    const response = await axios.get(
      `https://hades-black.vercel.app/api/codechef/user/${encodeURIComponent(username)}`,
      { timeout: 10000 }
    );
    // If user doesn't exist, codechef API typically returns an error or empty object
    return response.status === 200 && response.data?.success !== false && !!response.data?.data;
  } catch (err) {
    console.error(`CodeChef validation failed for ${username}:`, err.message);
    return false;
  }
}

/**
 * Validate GeeksforGeeks username by scraping practice page
 */
async function validateGeeksforGeeks(username) {
  if (!username) return false;
  try {
    const response = await axios.post(
      "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/",
      {
        handle: username,
        requestType: "",
        year: "",
        month: "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://www.geeksforgeeks.org",
          Referer: "https://www.geeksforgeeks.org/",
        },
        timeout: 10000,
      }
    );
    return response.data && response.data.status === "success" && !!response.data.result;
  } catch (err) {
    console.error(`GeeksforGeeks validation failed for ${username}:`, err.message);
    if (!err.response || (err.response.status === 403 || err.response.status === 400 || err.response.status >= 500)) {
      console.warn(`GeeksforGeeks validation bypassed due to potential Cloudflare/network issue for username: ${username}`);
      return true;
    }
    return false;
  }
}

/**
 * Validate GitHub username by calling GitHub REST API
 */
async function validateGitHub(username) {
  if (!username) return false;
  try {
    const response = await axios.get(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 10000
      }
    );
    return response.status === 200 && !!response.data?.login;
  } catch (err) {
    console.error(`GitHub validation failed for ${username}:`, err.message);
    return false;
  }
}

module.exports = {
  validateLeetCode,
  validateCodeChef,
  validateGeeksforGeeks,
  validateGitHub
};

const axios = require("axios");

// In-memory cache
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

class GeeksforGeeksClient {
  constructor() {
    this.api =
      "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/";
  }

  async fetchSubmissions(username) {
    try {
      const response = await axios.post(
        this.api,
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
          timeout: 20000,
        }
      );

      if (
        !response.data ||
        response.data.status !== "success" ||
        !response.data.result
      ) {
        throw new Error("No submission data found");
      }

      return response.data.result;
    } catch (error) {
      throw new Error(
        `Failed to fetch GFG data: ${error.message}`
      );
    }
  }

  buildStats(submissions) {
    const easy = Object.keys(submissions.Easy || {}).length;
    const medium = Object.keys(submissions.Medium || {}).length;
    const hard = Object.keys(submissions.Hard || {}).length;
    const basic = Object.keys(submissions.Basic || {}).length;

    const languageStats = {};

    ["Basic", "Easy", "Medium", "Hard"].forEach(
      (difficulty) => {
        Object.values(submissions[difficulty] || {}).forEach(
          (problem) => {
            if (problem.lang) {
              languageStats[problem.lang] =
                (languageStats[problem.lang] || 0) + 1;
            }
          }
        );
      }
    );

    return {
      totalProblemsSolved:
        basic + easy + medium + hard,
      basicProblemsSolved: basic,
      easyProblemsSolved: easy,
      mediumProblemsSolved: medium,
      hardProblemsSolved: hard,
      languageStats,
    };
  }

  buildPractice(submissions) {
    const allProblems = [];

    ["Basic", "Easy", "Medium", "Hard"].forEach(
      (difficulty) => {
        Object.values(submissions[difficulty] || {}).forEach(
          (problem) => {
            allProblems.push({
              title: problem.pname || "Unknown",
              difficulty,
              language: problem.lang || "Unknown",
              slug: problem.slug || "",
              timestamp:
                problem.user_subtime || null,
              questionUrl: problem.slug
                ? `https://www.geeksforgeeks.org/problems/${problem.slug}`
                : "",
            });
          }
        );
      }
    );

    allProblems.sort(
      (a, b) =>
        new Date(b.timestamp || 0) -
        new Date(a.timestamp || 0)
    );

    return {
      recentProblems: allProblems.slice(0, 20),
      totalProblemsAttempted:
        allProblems.length,
    };
  }

  async getProfile(username) {
    const submissions =
      await this.fetchSubmissions(username);

    return {
      profile: {
        username,
        displayName: username,
      },
      stats: this.buildStats(submissions),
      practice: this.buildPractice(submissions),
    };
  }
}

const client = new GeeksforGeeksClient();

async function fetchGFGProfile(
  username,
  force = false
) {
  if (!username) return null;

  const now = Date.now();
  const cached = cache.get(username);

  if (
    !force &&
    cached &&
    now - cached.timestamp <
      CACHE_TTL_MS
  ) {
    return cached.data;
  }

  try {
    const data = await client.getProfile(username);
    cache.set(username, {
      timestamp: now,
      data,
    });
    return data;
  } catch (error) {
    console.warn(`GFG API fetch failed for ${username}: ${error.message}`);
    // Check if stale cache exists
    if (cached) {
      console.log(`Returning stale GFG cache data for ${username}`);
      return cached.data;
    }
    // Return fallback values
    return {
      profile: {
        username,
        displayName: username,
      },
      stats: {
        totalProblemsSolved: 0,
        basicProblemsSolved: 0,
        easyProblemsSolved: 0,
        mediumProblemsSolved: 0,
        hardProblemsSolved: 0,
        languageStats: {},
      },
      practice: {
        recentProblems: [],
        totalProblemsAttempted: 0,
      },
    };
  }
}

module.exports = {
  fetchGFGProfile,
};

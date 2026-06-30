const axios = require('axios');

// In-memory cache for LeetCode profiles (TTL: 5 minutes)
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

const query = `
  query getUserProfile($username: String!) {
    allQuestionsCount {
      difficulty
      count
    }
    matchedUser(username: $username) {
      contributions {
        points
      }
      profile {
        reputation
        ranking
      }
      submissionCalendar
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      badges {
        id
        displayName
        icon
      }
      tagProblemCounts {
        advanced {
          tagName
          tagSlug
          problemsSolved
        }
        intermediate {
          tagName
          tagSlug
          problemsSolved
        }
        fundamental {
          tagName
          tagSlug
          problemsSolved
        }
      }
    }
    recentAcSubmissionList(username: $username, limit: 15) {
      title
      titleSlug
      timestamp
    }
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      topPercentage
    }
    userContestRankingHistory(username: $username) {
      attended
      rating
      ranking
      contest {
        title
        startTime
      }
    }
  }
`;

const formatData = (data, username) => {
  const matchedUser = data.matchedUser || {};
  const submitStats = matchedUser.submitStats || {};
  const acSubmissionNum = submitStats.acSubmissionNum || [];
  const totalSubmissionNum = submitStats.totalSubmissionNum || [];
  const allQuestionsCount = data.allQuestionsCount || [];
  const contest = data.userContestRanking || {};
  const rawHistory = data.userContestRankingHistory || [];

  // Parse submission calendar to object BEFORE storing
  let parsedCalendar = {};
  if (matchedUser.submissionCalendar) {
    try {
      parsedCalendar = JSON.parse(matchedUser.submissionCalendar || '{}');
    } catch (e) {
      console.warn("Failed to parse LeetCode submissionCalendar string:", e.message);
    }
  }

  const badgesList = matchedUser.badges ? matchedUser.badges.map(b => ({
    id: b.id,
    displayName: b.displayName || '',
    icon: b.icon ? (b.icon.startsWith('http') ? b.icon : `https://leetcode.com${b.icon}`) : ''
  })) : [];

  const formattedHistory = rawHistory
    .filter(h => h.attended)
    .map(h => ({
      name: h.contest?.title || 'Contest',
      date: h.contest?.startTime ? new Date(Number(h.contest.startTime) * 1000).toISOString().split('T')[0] : 'N/A',
      rating: h.rating,
      ranking: h.ranking || 0
    }));

  let arraysSolved = 0;
  let stringsSolved = 0;

  if (matchedUser.tagProblemCounts) {
    const tags = [
      ...(matchedUser.tagProblemCounts.advanced || []),
      ...(matchedUser.tagProblemCounts.intermediate || []),
      ...(matchedUser.tagProblemCounts.fundamental || [])
    ];
    
    tags.forEach(tag => {
      if (tag.tagSlug === 'array') {
        arraysSolved += tag.problemsSolved || 0;
      }
      if (tag.tagSlug === 'string') {
        stringsSolved += tag.problemsSolved || 0;
      }
    });
  }

  return {
    username,
    totalSolved: acSubmissionNum[0]?.count || 0,
    totalQuestions: allQuestionsCount[0]?.count || 0,
    easySolved: acSubmissionNum[1]?.count || 0,
    totalEasy: allQuestionsCount[1]?.count || 0,
    mediumSolved: acSubmissionNum[2]?.count || 0,
    totalMedium: allQuestionsCount[2]?.count || 0,
    hardSolved: acSubmissionNum[3]?.count || 0,
    totalHard: allQuestionsCount[3]?.count || 0,
    ranking: matchedUser.profile?.ranking || 0,
    contributionPoint: matchedUser.contributions?.points || 0,
    reputation: matchedUser.profile?.reputation || 0,
    submissionCalendar: parsedCalendar,
    recentSubmissions: data.recentAcSubmissionList || [],
    contestCount: contest.attendedContestsCount || 0,
    contestRating: contest.rating || 0,
    contestRanking: contest.globalRanking || 0,
    contestTopPercentage: contest.topPercentage || 0,
    acceptanceRate: totalSubmissionNum[0]?.submissions > 0 
      ? (acSubmissionNum[0]?.submissions / totalSubmissionNum[0]?.submissions) * 100 
      : 0,
    badges: badgesList,
    badgeCount: badgesList.length,
    contestHistory: formattedHistory,
    arraysSolved,
    stringsSolved
  };
};

async function fetchLeetCodeProfile(username, force = false) {
  if (!username) return null;

  const now = Date.now();
  const cached = cache.get(username);
  if (!force && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let retries = 3;
  let delay = 1000;

  while (retries > 0) {
    try {
      const response = await axios.post(
        'https://leetcode.com/graphql',
        { query, variables: { username } },
        {
          headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 20000
        }
      );

      if (response.data && response.data.errors) {
        throw new Error(response.data.errors[0]?.message || 'GraphQL Error');
      }

      const formatted = formatData(response.data.data, username);
      cache.set(username, { timestamp: now, data: formatted });
      return formatted;
    } catch (err) {
      retries--;
      console.warn(`LeetCode GraphQL sync attempt failed for ${username}. Retries left: ${retries}. Error:`, err.message);
      if (retries === 0) {
        // Cache Failure Strategy fallback
        if (cached) {
          console.log(`Returning stale LeetCode cache data for ${username}`);
          return cached.data;
        }
        return {
          username,
          totalSolved: 0,
          totalQuestions: 0,
          easySolved: 0,
          totalEasy: 0,
          mediumSolved: 0,
          totalMedium: 0,
          hardSolved: 0,
          totalHard: 0,
          ranking: 0,
          contributionPoint: 0,
          reputation: 0,
          submissionCalendar: {},
          recentSubmissions: [],
          contestCount: 0,
          contestRating: 0,
          contestRanking: 0,
          contestTopPercentage: 0,
          acceptanceRate: 0,
          badges: [],
          badgeCount: 0,
          arraysSolved: 0,
          stringsSolved: 0
        };
      }
      await new Promise(res => setTimeout(res, delay));
      delay *= 2; // exponential backoff
    }
  }
}

module.exports = {
  fetchLeetCodeProfile
};

const axios = require('axios');

async function inspect() {
    const paths = ['', '/rating', '/history', '/rating-history', '/contests'];
    for (const p of paths) {
      try {
        const ccRes = await axios.get(`https://hades-black.vercel.app/api/codechef/user/chef_aaditya${p}`);
        console.log(`Path: ${p} - status: ${ccRes.status} - keys:`, Object.keys(ccRes.data?.data || ccRes.data || {}));
        if (p === '/history' || p === '/rating-history') {
          console.log(`Path: ${p} sample:`, ccRes.data);
        }
      } catch (e) {
        console.log(`Path: ${p} failed: ${e.message}`);
      }
    }

  try {
    const leetcodeQuery = `
      query getUserContestRanking($username: String!) {
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
    const lcRes = await axios.post(
      'https://leetcode.com/graphql',
      { query: leetcodeQuery, variables: { username: 'awice' } },
      {
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    const history = lcRes.data?.data?.userContestRankingHistory || [];
    console.log('LeetCode history count:', history.length);
    const attended = history.filter(h => h.attended);
    console.log('LeetCode attended count:', attended.length);
    if (attended.length > 0) {
      console.log('Last LeetCode contest sample:', attended[attended.length - 1]);
    }
  } catch (err) {
    console.error('LeetCode inspect failed:', err.message);
  }
}

inspect();

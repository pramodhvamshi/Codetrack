// V5 Competitive Programming Analytics System - Configuration

export const LEADERBOARD_CONFIG = {
  platforms: [
    {
      id: 'leetcode',
      name: 'LeetCode',
      color: '#F59E0B', // Amber
      columns: [
        { label: 'Solved', key: 'platformStats.leetcode.problemsSolved', accessor: (row) => row.platformStats?.leetcode?.problemsSolved || 0 },
        { label: 'Rating', key: 'platformStats.leetcode.rating', accessor: (row) => Math.round(row.platformStats?.leetcode?.rating || 0) },
        { label: 'Contests', key: 'platformStats.leetcode.contestCount', accessor: (row) => row.platformStats?.leetcode?.contestCount || 0 },
        { label: 'Score', key: 'scores.lcScore', accessor: (row) => Math.round(row.competitiveBreakdown?.leetcode?.score || 0), isScore: true }
      ]
    },
    {
      id: 'codechef',
      name: 'CodeChef',
      color: '#ef4444', // Red
      columns: [
        { label: 'Solved', key: 'platformStats.codechef.problemsSolved', accessor: (row) => row.platformStats?.codechef?.problemsSolved || 0 },
        { label: 'Rating', key: 'platformStats.codechef.currentRating', accessor: (row) => Math.round(row.platformStats?.codechef?.currentRating || 0) },
        { label: 'Contests', key: 'platformStats.codechef.contestCount', accessor: (row) => row.platformStats?.codechef?.contestCount || 0 },
        { label: 'Score', key: 'scores.ccScore', accessor: (row) => Math.round(row.competitiveBreakdown?.codechef?.score || 0), isScore: true }
      ]
    },
    {
      id: 'geeksforgeeks',
      name: 'GeeksforGeeks',
      color: '#22C55E', // Green
      columns: [
        { label: 'Solved', key: 'platformStats.geeksforgeeks.problemsSolved', accessor: (row) => row.platformStats?.geeksforgeeks?.problemsSolved || 0 },
        { label: 'Coding Score', key: 'platformStats.geeksforgeeks.codingScore', accessor: (row) => row.platformStats?.geeksforgeeks?.codingScore || 0 },
        { label: 'Streak', key: 'platformStats.geeksforgeeks.streak', accessor: (row) => row.platformStats?.geeksforgeeks?.streak || 0 },
        { label: 'Score', key: 'scores.gfgScore', accessor: (row) => Math.round(row.competitiveBreakdown?.geeksforgeeks?.score || 0), isScore: true }
      ]
    },
    {
      id: 'hackerrank',
      name: 'HackerRank',
      color: '#2EC866', // Green Alt
      columns: [
        { label: 'Solved', key: 'hackerrank.totalProblemsSolved', accessor: (row) => row.hackerrank?.totalProblemsSolved || 0 },
        { label: 'Badges', key: 'hackerrank.badgeCount', accessor: (row) => row.hackerrank?.badgeCount || 0 },
        { label: 'Score', key: 'scores.hrScore', accessor: (row) => Math.round(row.competitiveBreakdown?.hackerrank?.score || 0), isScore: true }
      ]
    }
  ]
};

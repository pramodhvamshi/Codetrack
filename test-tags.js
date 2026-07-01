const axios = require('axios');
const query = `
  query skillStats($username: String!) {
    matchedUser(username: $username) {
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
  }
`;
axios.post('https://leetcode.com/graphql', { query, variables: { username: 'pramodhvamshi' } }, {
  headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com', 'User-Agent': 'Mozilla/5.0' }
}).then(res => {
  const data = res.data.data.matchedUser.tagProblemCounts;
  console.log(JSON.stringify(data, null, 2));
})
.catch(err => console.error(err.message));

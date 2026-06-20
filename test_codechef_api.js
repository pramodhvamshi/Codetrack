const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('https://hades-black.vercel.app/api/codechef/user/premsai098');
    console.log('API keys:', Object.keys(res.data?.data || {}));
    if (res.data?.data?.contests) {
      console.log('Contests count:', res.data.data.contests.length);
      console.log('First few contests:', JSON.stringify(res.data.data.contests.slice(0, 3), null, 2));
    } else {
      console.log('No contests array');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();

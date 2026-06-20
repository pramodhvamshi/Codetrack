const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('https://hades-black.vercel.app/api/codechef/user/premsai098');
    console.log('Rating object:', JSON.stringify(res.data?.data?.rating, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();

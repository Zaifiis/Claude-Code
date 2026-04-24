const axios = require('axios');

const SUBREDDITS = [
  'artificial',
  'ChatGPT',
  'OpenAI',
  'entrepreneur',
  'smallbusiness',
  'AItools'
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetch() {
  const items = [];

  for (const sub of SUBREDDITS) {
    try {
      const response = await axios.get(
        `https://www.reddit.com/r/${sub}/hot.json?limit=25`,
        {
          headers: { 'User-Agent': 'ContentEngine/1.0' },
          timeout: 10000
        }
      );

      const posts = response.data?.data?.children || [];
      for (const post of posts) {
        const d = post.data;
        if (!d.title || d.stickied) continue;
        items.push({
          id: `reddit_${d.id}`,
          source: 'Reddit',
          subreddit: sub,
          title: d.title,
          score: d.score || 0,
          num_comments: d.num_comments || 0,
          upvote_ratio: d.upvote_ratio || 0.5,
          created_utc: d.created_utc,
          url: `https://reddit.com${d.permalink}`
        });
      }
    } catch (err) {
      console.error(`Reddit r/${sub} failed:`, err.message);
    }

    await sleep(2000);
  }

  return items;
}

module.exports = { fetch };

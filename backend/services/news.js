const Parser = require('rss-parser');

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'ContentEngine/1.0' }
});

const FEEDS = [
  'https://techcrunch.com/feed/',
  'https://feeds.feedburner.com/TheHackersNews',
  'https://www.artificialintelligence-news.com/feed/',
  'https://hnrss.org/frontpage',
  'https://feeds.arstechnica.com/arstechnica/technology-lab'
];

async function fetch() {
  const items = [];

  await Promise.allSettled(
    FEEDS.map(async (feedUrl) => {
      try {
        const feed = await parser.parseURL(feedUrl);
        for (const item of (feed.items || []).slice(0, 20)) {
          if (!item.title) continue;
          const rawId = (item.link || item.title || '').slice(0, 64);
          items.push({
            id: `news_${Buffer.from(rawId).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`,
            source: 'News',
            feedName: feed.title || feedUrl,
            title: item.title,
            link: item.link || '',
            pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
            contentSnippet: (item.contentSnippet || '').slice(0, 300)
          });
        }
      } catch (err) {
        console.error(`Feed failed ${feedUrl}:`, err.message);
      }
    })
  );

  return items;
}

module.exports = { fetch };

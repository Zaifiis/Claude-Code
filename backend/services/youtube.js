const axios = require('axios');

const INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.privacydev.net'
];

const ENDPOINTS = [
  '/api/v1/trending?region=US&type=tech',
  '/api/v1/search?q=AI+tools+2024&sort_by=upload_date&page=1',
  '/api/v1/search?q=AI+automation+business&sort_by=upload_date'
];

async function fetchFromInstance(baseUrl) {
  const items = [];

  for (const endpoint of ENDPOINTS) {
    try {
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        timeout: 10000,
        headers: { 'User-Agent': 'ContentEngine/1.0' }
      });

      const videos = Array.isArray(response.data) ? response.data : [];
      for (const v of videos.slice(0, 20)) {
        if (!v.title) continue;
        items.push({
          id: `yt_${v.videoId || Math.random().toString(36).slice(2)}`,
          source: 'YouTube',
          title: v.title,
          viewCount: v.viewCount || 0,
          likeCount: v.likeCount || 0,
          published: v.published || Math.floor(Date.now() / 1000),
          author: v.author || '',
          url: `https://youtube.com/watch?v=${v.videoId}`
        });
      }
    } catch (err) {
      console.error(`YouTube endpoint ${endpoint} on ${baseUrl} failed:`, err.message);
    }
  }

  return items;
}

async function fetch() {
  for (const instance of INSTANCES) {
    try {
      const items = await fetchFromInstance(instance);
      if (items.length > 0) return items;
    } catch (err) {
      console.error(`Invidious instance ${instance} failed:`, err.message);
    }
  }
  return [];
}

module.exports = { fetch };

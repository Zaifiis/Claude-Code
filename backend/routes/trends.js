const express = require('express');
const router = express.Router();
const reddit = require('../services/reddit');
const youtube = require('../services/youtube');
const news = require('../services/news');
const scorer = require('../services/scorer');

router.get('/', async (req, res) => {
  try {
    const [redditResult, youtubeResult, newsResult] = await Promise.allSettled([
      reddit.fetch(),
      youtube.fetch(),
      news.fetch()
    ]);

    const items = [
      ...(redditResult.status === 'fulfilled' ? redditResult.value : []),
      ...(youtubeResult.status === 'fulfilled' ? youtubeResult.value : []),
      ...(newsResult.status === 'fulfilled' ? newsResult.value : [])
    ];

    const scored = scorer.scoreAndClassify(items);
    res.json(scored);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const debateEngine = require('../services/debateEngine');

router.post('/', async (req, res) => {
  const { topic, pipeline, platform } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (stage, data) => {
    res.write(`data: ${JSON.stringify({ stage, data })}\n\n`);
  };

  try {
    await debateEngine.run(topic, pipeline, platform, send);
  } catch (err) {
    send('error', err.message);
  }

  res.end();
});

module.exports = router;

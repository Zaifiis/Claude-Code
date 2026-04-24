const PIPELINES = {
  pipeline1: {
    name: 'AI News',
    keywords: ['GPT', 'OpenAI', 'Gemini', 'Claude', 'Anthropic', 'AI model', 'LLM', 'AGI', 'Sora', 'AI regulation', 'AI law']
  },
  pipeline2: {
    name: 'AI Tools',
    keywords: ['automation', 'workflow', 'n8n', 'zapier', 'make.com', 'AI tool', 'productivity', 'SaaS', 'API', 'integration', 'no-code', 'AI agent']
  },
  pipeline3: {
    name: 'Business + AI',
    keywords: ['revenue', 'client', 'appointment', 'medspa', 'salon', 'dental', 'law firm', 'real estate', 'coach', 'ROI', 'leads', 'booking', 'AI receptionist', 'customer service AI', 'small business AI']
  }
};

function getBaseScore(item) {
  if (item.source === 'Reddit') {
    const s = (item.score / 100) + (item.num_comments / 50) + (item.upvote_ratio * 2);
    return Math.min(5, s);
  }

  if (item.source === 'YouTube') {
    const s = (item.viewCount / 100000) + (item.likeCount / 10000);
    return Math.min(5, s);
  }

  if (item.source === 'News') {
    const now = Date.now();
    const pub = item.pubDate ? new Date(item.pubDate).getTime() : 0;
    const hoursAgo = (now - pub) / 3600000;
    if (hoursAgo <= 24) return 3;
    if (hoursAgo <= 48) return 2;
    if (hoursAgo <= 72) return 1;
    return 0;
  }

  return 0;
}

function countKeywordMatches(text, keywords) {
  const lower = text.toLowerCase();
  let count = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) count++;
  }
  return count;
}

function scoreItem(item, allItems) {
  const text = `${item.title} ${item.contentSnippet || ''}`;
  const baseScore = getBaseScore(item);

  const pipelineScores = {};
  let maxRelevanceBonus = 0;

  for (const [pKey, pData] of Object.entries(PIPELINES)) {
    const matches = countKeywordMatches(text, pData.keywords);
    const bonus = Math.min(4, matches * 2);
    pipelineScores[pKey] = bonus;
    if (bonus > maxRelevanceBonus) maxRelevanceBonus = bonus;
  }

  const titleWords = item.title.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
  const platformSources = new Set([item.source]);

  for (const other of allItems) {
    if (other.id === item.id) continue;
    const otherWords = other.title.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const overlap = titleWords.filter((w) => otherWords.includes(w)).length;
    if (overlap >= 2) platformSources.add(other.source);
  }

  let crossBonus = 0;
  if (platformSources.size >= 3) crossBonus = 3;
  else if (platformSources.size >= 2) crossBonus = 1.5;

  const finalScore = Math.min(10, baseScore + maxRelevanceBonus + crossBonus);

  return {
    ...item,
    priorityScore: Math.round(finalScore * 10) / 10,
    pipelineScores,
    platforms: [...platformSources]
  };
}

function scoreAndClassify(items) {
  const deduped = Array.from(new Map(items.map((i) => [i.id, i])).values());
  const scored = deduped.map((item) => scoreItem(item, deduped));

  const pipelines = { pipeline1: [], pipeline2: [], pipeline3: [] };

  for (const item of scored) {
    for (const pKey of Object.keys(PIPELINES)) {
      if (item.pipelineScores[pKey] > 0) {
        pipelines[pKey].push(item);
      }
    }
  }

  for (const pKey of Object.keys(pipelines)) {
    pipelines[pKey] = pipelines[pKey]
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 10);
  }

  const allSorted = [...scored].sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    pipelines,
    pipelineNames: Object.fromEntries(Object.entries(PIPELINES).map(([k, v]) => [k, v.name])),
    allSorted: allSorted.slice(0, 50),
    fetchedAt: new Date().toISOString()
  };
}

module.exports = { scoreAndClassify };
